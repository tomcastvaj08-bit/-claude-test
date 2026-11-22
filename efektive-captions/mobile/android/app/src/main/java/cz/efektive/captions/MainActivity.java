package cz.efektive.captions;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BracketPlugin.class);   // expoziční řada pro Realitní fotky
        super.onCreate(savedInstanceState);
    }
}
