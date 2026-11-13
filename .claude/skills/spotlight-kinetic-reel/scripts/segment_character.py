"""Cut the character (person + chair) out of every footage frame with BiRefNet-portrait.
Runs onnxruntime directly with the memory arena OFF (rembg's default session grows
to >14 GB on CPU and gets OOM-killed).  Resumable: existing mattes are skipped.
Usage: python3 segment_character.py FRAMES_DIR MATTE_DIR 1-138 180-223 [...]
Model: pip install rembg onnxruntime; python3 -c "from rembg import new_session; new_session('birefnet-portrait')"
       (downloads ~/.rembg/models/birefnet-portrait/birefnet-portrait.onnx)"""
import sys, os, glob, numpy as np, onnxruntime as ort
from PIL import Image

FR, MD = sys.argv[1], sys.argv[2]
frames = []
for r in sys.argv[3:]:
    a, b = map(int, r.split('-')); frames += list(range(a, b + 1))
os.makedirs(MD, exist_ok=True)
cands = glob.glob(os.path.expanduser('~/.rembg/models/birefnet-portrait/*.onnx')) + glob.glob(os.path.expanduser('~/.u2net/birefnet-portrait.onnx'))
o = ort.SessionOptions(); o.enable_cpu_mem_arena = False; o.enable_mem_pattern = False
o.intra_op_num_threads = int(os.environ.get('NT', os.cpu_count() or 4))
sess = ort.InferenceSession(cands[0], o, providers=['CPUExecutionProvider'])
inp = sess.get_inputs()[0].name
mean = np.array([0.485, 0.456, 0.406]); std = np.array([0.229, 0.224, 0.225])
for i in frames:
    out = f'{MD}/m{i:03d}.png'
    if os.path.exists(out): continue
    im = Image.open(f'{FR}/f{i:03d}.png').convert('RGB')
    x = (np.asarray(im.resize((1024, 1024), Image.LANCZOS)) / 255.0 - mean) / std
    y = sess.run(None, {inp: x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0, 0]
    y = 1 / (1 + np.exp(-y)); y = (y - y.min()) / (y.max() - y.min() + 1e-8)
    Image.fromarray((y * 255).astype(np.uint8)).resize(im.size, Image.LANCZOS).save(out)
    print(i, flush=True)
