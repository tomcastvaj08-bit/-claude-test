package cz.efektive.captions;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.ImageFormat;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.*;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Range;
import android.util.Size;
import android.view.Surface;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Expoziční řada pro realitní fotky (Camera2).
 * 1) změří světlo (automatická expozice), 2) přepne na ruční expozici a vyfotí 5 JPEG záběrů
 *    s EV posuny (výchozí −6, −4, −2, 0, +2), 3) uloží je do cache a vrátí cesty.
 * Web náhled (getUserMedia) se před voláním zavře – kamera nejde otevřít dvakrát.
 */
@CapacitorPlugin(name = "Bracket", permissions = { @Permission(alias = "camera", strings = { Manifest.permission.CAMERA }) })
public class BracketPlugin extends Plugin {

    private HandlerThread thread;
    private Handler handler;

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", true);
        call.resolve(r);
    }

    @PluginMethod
    public void capture(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) { requestPermissionForAlias("camera", call, "permCb"); return; }
        doCapture(call);
    }

    @PermissionCallback
    private void permCb(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) doCapture(call);
        else call.reject("Bez povolení kamery to nejde");
    }

    private static double[] evList(PluginCall call) {
        JSArray a = call.getArray("evs");
        if (a == null) return new double[]{ -6, -4, -2, 0, 2 };
        try { List<Object> l = a.toList(); double[] r = new double[l.size()]; for (int i = 0; i < l.size(); i++) r[i] = ((Number) l.get(i)).doubleValue(); return r; }
        catch (Exception e) { return new double[]{ -6, -4, -2, 0, 2 }; }
    }

    /** zadní kamera s nejkratší ohniskovou vzdáleností (širokoúhlá, jak to telefon dovolí) */
    private String pickCamera(CameraManager cm, boolean wide) throws CameraAccessException {
        String best = null; float bestF = Float.MAX_VALUE; String main = null;
        for (String id : cm.getCameraIdList()) {
            CameraCharacteristics c = cm.getCameraCharacteristics(id);
            Integer facing = c.get(CameraCharacteristics.LENS_FACING);
            if (facing == null || facing != CameraCharacteristics.LENS_FACING_BACK) continue;
            if (main == null) main = id;
            float[] f = c.get(CameraCharacteristics.LENS_INFO_AVAILABLE_FOCAL_LENGTHS);
            if (f != null && f.length > 0 && f[0] < bestF) { bestF = f[0]; best = id; }
        }
        return wide && best != null ? best : main;
    }

    @SuppressLint("MissingPermission")
    private void doCapture(PluginCall call) {
        final double[] evs = evList(call);
        final boolean wide = call.getBoolean("wide", true);
        final long maxHandNs = (long) (call.getDouble("maxExposureMs", 66.0) * 1_000_000L);   // nejdelší čas z ruky
        thread = new HandlerThread("bracket"); thread.start(); handler = new Handler(thread.getLooper());
        final Context ctx = getContext();
        final CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
        final AtomicBoolean done = new AtomicBoolean(false);
        try {
            final String camId = pickCamera(cm, wide);
            if (camId == null) { call.reject("Telefon nemá zadní kameru"); stop(); return; }
            final CameraCharacteristics ch = cm.getCameraCharacteristics(camId);
            StreamConfigurationMap map = ch.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
            Size[] sizes = map.getOutputSizes(ImageFormat.JPEG);
            Size big = sizes[0]; for (Size s : sizes) if ((long) s.getWidth() * s.getHeight() > (long) big.getWidth() * big.getHeight()) big = s;
            final Range<Long> expR = ch.get(CameraCharacteristics.SENSOR_INFO_EXPOSURE_TIME_RANGE);
            final Range<Integer> isoR = ch.get(CameraCharacteristics.SENSOR_INFO_SENSITIVITY_RANGE);
            int[] caps = ch.get(CameraCharacteristics.REQUEST_AVAILABLE_CAPABILITIES);
            boolean manual = false; if (caps != null) for (int c : caps) if (c == CameraMetadata.REQUEST_AVAILABLE_CAPABILITIES_MANUAL_SENSOR) manual = true;
            final boolean canManual = manual && expR != null && isoR != null;
            final Range<Integer> compR = ch.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_RANGE);
            final android.util.Rational compStep = ch.get(CameraCharacteristics.CONTROL_AE_COMPENSATION_STEP);
            final Integer orient = ch.get(CameraCharacteristics.SENSOR_ORIENTATION);

            final ImageReader reader = ImageReader.newInstance(big.getWidth(), big.getHeight(), ImageFormat.JPEG, evs.length + 1);
            final SurfaceTexture dummy = new SurfaceTexture(10); dummy.setDefaultBufferSize(640, 480);
            final Surface preview = new Surface(dummy);
            final List<String> paths = new ArrayList<>();
            final File dir = new File(ctx.getCacheDir(), "bracket"); dir.mkdirs();
            for (File f : dir.listFiles() != null ? dir.listFiles() : new File[0]) f.delete();
            final long stamp = System.currentTimeMillis();

            cm.openCamera(camId, new CameraDevice.StateCallback() {
                @Override public void onOpened(final CameraDevice cam) {
                    try {
                        cam.createCaptureSession(Arrays.asList(preview, reader.getSurface()), new CameraCaptureSession.StateCallback() {
                            @Override public void onConfigured(final CameraCaptureSession ses) {
                                try {
                                    // 1) měření: náhled s automatikou, po ~25 snímcích vezmeme čas a ISO
                                    final CaptureRequest.Builder pb = cam.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
                                    pb.addTarget(preview);
                                    pb.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO);
                                    pb.set(CaptureRequest.CONTROL_AE_MODE, CameraMetadata.CONTROL_AE_MODE_ON);
                                    pb.set(CaptureRequest.CONTROL_AF_MODE, CameraMetadata.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
                                    final int[] n = {0};
                                    ses.setRepeatingRequest(pb.build(), new CameraCaptureSession.CaptureCallback() {
                                        @Override public void onCaptureCompleted(CameraCaptureSession s, CaptureRequest r, TotalCaptureResult res) {
                                            if (++n[0] < 25 || done.get()) return;
                                            done.set(true);
                                            try {
                                                s.stopRepeating();
                                                Long t0 = res.get(CaptureResult.SENSOR_EXPOSURE_TIME);
                                                Integer iso0 = res.get(CaptureResult.SENSOR_SENSITIVITY);
                                                List<CaptureRequest> burst = new ArrayList<>();
                                                for (double ev : evs) {
                                                    CaptureRequest.Builder b = cam.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE);
                                                    b.addTarget(reader.getSurface());
                                                    b.set(CaptureRequest.JPEG_QUALITY, (byte) 95);
                                                    if (orient != null) b.set(CaptureRequest.JPEG_ORIENTATION, orient);
                                                    b.set(CaptureRequest.CONTROL_AF_MODE, CameraMetadata.CONTROL_AF_MODE_CONTINUOUS_PICTURE);
                                                    if (canManual && t0 != null && iso0 != null) {
                                                        // stejná „světelná hodnota“ × 2^EV; nejdřív čas (max. z ruky), zbytek dorovná ISO
                                                        double target = (double) t0 * iso0 * Math.pow(2, ev);
                                                        long t = (long) Math.max(expR.getLower(), Math.min(Math.min(expR.getUpper(), maxHandNs), target / isoR.getLower()));
                                                        int iso = (int) Math.max(isoR.getLower(), Math.min(isoR.getUpper(), Math.round(target / t)));
                                                        if (iso == isoR.getLower()) t = (long) Math.max(expR.getLower(), Math.min(expR.getUpper(), target / iso));
                                                        b.set(CaptureRequest.CONTROL_AE_MODE, CameraMetadata.CONTROL_AE_MODE_OFF);
                                                        b.set(CaptureRequest.SENSOR_EXPOSURE_TIME, t);
                                                        b.set(CaptureRequest.SENSOR_SENSITIVITY, iso);
                                                        b.set(CaptureRequest.SENSOR_FRAME_DURATION, t);
                                                    } else if (compR != null && compStep != null) {
                                                        int steps = (int) Math.round(ev / compStep.doubleValue());
                                                        b.set(CaptureRequest.CONTROL_AE_MODE, CameraMetadata.CONTROL_AE_MODE_ON);
                                                        b.set(CaptureRequest.CONTROL_AE_EXPOSURE_COMPENSATION, Math.max(compR.getLower(), Math.min(compR.getUpper(), steps)));
                                                    }
                                                    burst.add(b.build());
                                                }
                                                reader.setOnImageAvailableListener(rd -> {
                                                    Image img = rd.acquireNextImage(); if (img == null) return;
                                                    try {
                                                        ByteBuffer buf = img.getPlanes()[0].getBuffer(); byte[] bytes = new byte[buf.remaining()]; buf.get(bytes);
                                                        File f = new File(dir, "ev" + stamp + "_" + paths.size() + ".jpg");
                                                        try (FileOutputStream o = new FileOutputStream(f)) { o.write(bytes); }
                                                        paths.add(f.getAbsolutePath());
                                                    } catch (Exception e) { /* záběr přeskočit */ }
                                                    finally { img.close(); }
                                                    if (paths.size() >= evs.length) {
                                                        JSObject out = new JSObject(); JSArray arr = new JSArray(); for (String p : paths) arr.put(p);
                                                        out.put("paths", arr); out.put("manual", canManual); out.put("evs", new JSArray(evsAsList(evs)));
                                                        cleanup(cam, reader, preview, dummy); call.resolve(out);
                                                    }
                                                }, handler);
                                                if (canManual) s.captureBurst(burst, null, handler);
                                                else for (CaptureRequest q : burst) s.capture(q, null, handler);   // korekce expozice: po jednom, ať se AE stihne přizpůsobit
                                            } catch (Exception e) { cleanup(cam, reader, preview, dummy); call.reject("Focení se nepovedlo: " + e.getMessage()); }
                                        }
                                    }, handler);
                                } catch (Exception e) { cleanup(cam, reader, preview, dummy); call.reject("Kamera: " + e.getMessage()); }
                            }
                            @Override public void onConfigureFailed(CameraCaptureSession ses) { cleanup(cam, reader, preview, dummy); call.reject("Kameru nejde nastavit"); }
                        }, handler);
                    } catch (Exception e) { cleanup(cam, reader, preview, dummy); call.reject("Kamera: " + e.getMessage()); }
                }
                @Override public void onDisconnected(CameraDevice cam) { cleanup(cam, reader, preview, dummy); }
                @Override public void onError(CameraDevice cam, int err) { cleanup(cam, reader, preview, dummy); call.reject("Kamera hlásí chybu " + err); }
            }, handler);
        } catch (Exception e) { stop(); call.reject("Kamera: " + e.getMessage()); }
    }

    private static List<Double> evsAsList(double[] e) { List<Double> l = new ArrayList<>(); for (double d : e) l.add(d); return l; }

    private void cleanup(CameraDevice cam, ImageReader reader, Surface preview, SurfaceTexture tex) {
        try { cam.close(); } catch (Exception ignored) {}
        try { reader.close(); } catch (Exception ignored) {}
        try { preview.release(); tex.release(); } catch (Exception ignored) {}
        stop();
    }
    private void stop() { if (thread != null) { thread.quitSafely(); thread = null; } }
}
