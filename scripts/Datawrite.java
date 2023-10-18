package scripts;
import java.io.*;
import java.util.*;
public class Datawrite {
    public static void main(String[] args) throws Exception {
        System.out.print("datawrite   ");
        long start = System.currentTimeMillis();
        BufferedReader br = new BufferedReader(new FileReader("../allwords.txt"));
        File output = new File("../min/data.txt");
        if (output.exists()) {
            output.delete();
        }
        output.createNewFile();
        PrintWriter bw = new PrintWriter(output);
        String a, lang = "en", w;
        BufferedReader xml = new BufferedReader(new FileReader("../jvs/jbovlaste-en.xml"));
        String line = xml.readLine();
        while ((a = br.readLine()) != null) {
            if (!lang.equals(a.split("   ")[0])) {
                lang = a.split("   ")[0];
                xml = new BufferedReader(new FileReader("../jvs/jbovlaste-" + lang + ".xml"));
            }
            w = a.split("   ")[1];
            while (!line.contains("<valsi") || !line.contains("word=\"" + w + "\"")) {
                line = xml.readLine();
            }
            String type = line.substring(line.indexOf("type=\"") + 6, line.indexOf("\"", line.indexOf("type=\"") + 6));
            if (type.startsWith("obs")) {
                continue;
            }
            String selmaho = "", author = "";
            line = xml.readLine();
            ArrayList<String> rafsi = new ArrayList<String>();
            while (line.contains("<rafsi>")) {
                rafsi.add(line.substring(line.indexOf("<rafsi>") + 7, line.indexOf("</rafsi>")));
                line = xml.readLine();
            }
            if (line.contains("<selmaho>")) {
                selmaho = line.substring(line.indexOf("<selmaho>") + 9, line.indexOf("</selmaho>"));
                line = xml.readLine();
            }
            while (!line.contains("<username>")) {
                line = xml.readLine();
            }
            if (line.contains("<username>")) {
                author = line.substring(line.indexOf("<username>") + 10, line.indexOf("</username>")).toLowerCase();
            }
            while (!line.contains("<definition>")) {
                line = xml.readLine();
            }
            String definition = "";
            definition = line.substring(line.indexOf("<definition>") + 12, line.indexOf("</definition>"));
            line = xml.readLine();
            line = xml.readLine();
            String score = line.substring(line.indexOf("<score>") + 7, line.indexOf("</score>"));
            while (!line.contains("<notes>") && !line.contains("<glossword word=\"") && !line.contains("</valsi>")) {
                line = xml.readLine();
            }
            String notes = "";
            if (line.contains("<notes>")) {
                if (line.contains("</notes>")) {
                    notes = line.substring(line.indexOf("<notes>") + 7, line.indexOf("</notes>"));
                } else {
                    notes = line.substring(line.indexOf("<notes>") + 7);
                    while (!line.contains("</notes>")) {
                        line = xml.readLine();
                        notes += line;
                    }
                    notes = notes.substring(0, notes.indexOf("</notes>"));
                }
            }
            while (!line.contains("</valsi>")) {
                if (line.contains("<glossword")) {
                    break;
                }
                line = xml.readLine();
            }
            ArrayList<String> glosswords = new ArrayList<String>();
            while (line.contains("<glossword word=\"")) {
                glosswords.add(line.substring(line.indexOf("word=\"") + 6, line.indexOf("\"", line.indexOf("word=\"") + 6)));
                line = xml.readLine();
            }
            bw.print("---\n" + despace(w) + " " + despace(type) + " ");
            if (!selmaho.equals("")) {
                bw.print(despace(dehtml(selmaho).replace("'", "h")) + " ");
            }
            if (rafsi.size() > 0) {
                bw.print("[");
                for (int i = 0; i < rafsi.size(); i++) {
                    bw.print("-" + dehtml(rafsi.get(i)));
                }
                bw.print("-] ");
            }
            bw.print(anum(author) + " " + score + "\n" + dehtml(definition) + "\n");
            if (!notes.equals("")) {
                bw.print("-n\n" + dehtml(notes) + "\n");
            }
            if (glosswords.size() > 0) {
                bw.print("-g\n");
                for (int i = 0; i < glosswords.size(); i++) {
                    bw.print(dehtml(glosswords.get(i)) + "\n");
                }
            }
        }
        bw.print("---");
        br.close();
        bw.close();
        xml.close();
        long end = System.currentTimeMillis();
        System.out.println((end - start) + " ms");
    }
    public static String dehtml(String s) {
        return s.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&apos;", "'").replaceAll("&quot;", "\"");
    }
    public static String despace(String s) {
        return s.replaceAll(" ", "_");
    }
    public static String anum(String s) {
        return s.replaceAll("[^a-z0-9]", "");
    }
}