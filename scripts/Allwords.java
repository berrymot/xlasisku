package scripts;
import java.io.*;
import java.util.*;
public class Allwords {
    public static void main(String[] args) throws Exception {
        System.out.print("allwords    ");
        long start = System.currentTimeMillis();
        String[] langs = {"en", "am", "ar", "art-guaspi", "art-loglan", "be", "bg", "br", "ca", "ch", "cs", "cy", "da", "de", "el", "en-bpfk", "en-simple", "eo", "es", "et", "eu", "fa", "fi", "fr-facile", "fr", "ga", "gl", "gu", "he", "hi", "hr", "hu", "ia", "id", "it", "ja", "jbo", "ka", "ko", "kw", "la", "lt", "lv", "mg", "ne", "nl", "no", "pl", "pt-br", "pt", "ro", "ru", "sa", "sk", "sl", "so", "sq", "sr", "sv", "ta", "test", "tlh", "tok", "tpi", "tr", "uk", "vi", "wa", "zh"};
        ArrayList<String> all = new ArrayList<>();
        for (String l : langs) {
            BufferedReader br = new BufferedReader(new FileReader("../jvs/jbovlaste-" + l + ".xml"));
            String line;
            while ((line = br.readLine()) != null) {
                if (line.contains("<valsi")) {
                    String word = line.substring(line.indexOf("word=\"") + 6, line.indexOf("\"", line.indexOf("word=\"") + 6));
                    boolean has = false;
                    for (String s : all) {
                        if (s.endsWith("   " + word)) {
                            has = true;
                            break;
                        }
                    }
                    if (!has) {
                        all.add(l + "   " + word);
                    }
                }
            }
            br.close();
        }
        PrintWriter pw = new PrintWriter("../allwords.txt");
        // for (int i = 0; i < all.size(); i++) {
        //     if (all.get(i).startsWith("en   ")) {
        //         all.remove(i);
        //         i--;
        //     }
        // }
        for (String w : all) {
            pw.println(w);
        }
        pw.close();
        long end = System.currentTimeMillis();
        System.out.println((end - start) + " ms");
    }
}