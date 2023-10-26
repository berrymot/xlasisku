package scripts;
import java.io.*;
import java.util.*;
public class Jvsparse {
    public static void main(String[] args) throws Exception {
        System.out.print("jvsparse    ");
        long start = System.currentTimeMillis();
        BufferedReader br = new BufferedReader(new FileReader("../jvs/jbovlaste-en.xml"));
        File output = new File("temp");
        if (output.exists()) {
            output.delete();
        }
        output.createNewFile();
        PrintWriter bw = new PrintWriter("temp");
        bw.print("const jbo=[");
        String line;
        while ((line = br.readLine()) != null) {
            if (!line.contains("<valsi") && !line.contains("</valsi>")) {
                continue;
            }
            if (line.contains("<valsi")) {
                String word = line.substring(line.indexOf("word=\"") + 6, line.indexOf("\"", line.indexOf("word=\"") + 6));
                String type = line.substring(line.indexOf("type=\"") + 6, line.indexOf("\"", line.indexOf("type=\"") + 6));
                if (type.startsWith("obs") || word.equals(".i")) {
                    continue;
                }
                String selmaho = "";
                line = br.readLine();
                ArrayList<String> rafsi = new ArrayList<String>();
                while (line.contains("<rafsi>")) {
                    rafsi.add(line.substring(line.indexOf("<rafsi>") + 7, line.indexOf("</rafsi>")).replaceAll("&apos;", "'"));
                    line = br.readLine();
                }
                if (line.contains("<selmaho>")) {
                    selmaho = line.substring(line.indexOf("<selmaho>") + 9, line.indexOf("</selmaho>")).replaceAll("&apos;", "h");
                    line = br.readLine();
                }
                while (!line.contains("<definition>")) {
                    line = br.readLine();
                }
                String definition = "";
                definition = line.substring(line.indexOf("<definition>") + 12, line.indexOf("</definition>"));
                line = br.readLine();
                line = br.readLine();
                String score = line.substring(line.indexOf("<score>") + 7, line.indexOf("</score>"));
                if (Integer.valueOf(score) < -1) {
                    continue;
                }
                while (!line.contains("<notes>") && !line.contains("<glossword word=\"") && !line.contains("</valsi>")) {
                    line = br.readLine();
                }
                String notes = "";
                if (line.contains("<notes>")) {
                    if (line.contains("</notes>")) {
                        notes = line.substring(line.indexOf("<notes>") + 7, line.indexOf("</notes>"));
                    } else {
                        notes = line.substring(line.indexOf("<notes>") + 7);
                        while (!line.contains("</notes>")) {
                            line = br.readLine();
                            notes += line;
                        }
                        notes = notes.substring(0, notes.indexOf("</notes>"));
                    }
                }
                while (!line.contains("</valsi>")) {
                    if (line.contains("<glossword")) {
                        break;
                    }
                    line = br.readLine();
                }
                ArrayList<String> glosswords = new ArrayList<String>();
                while (line.contains("<glossword word=\"")) {
                    glosswords.add(line.substring(line.indexOf("word=\"") + 6, line.indexOf("\"", line.indexOf("word=\"") + 6)));
                    line = br.readLine();
                }
                bw.print("{\"word\":\"" + word + "\",");
                if (!selmaho.equals("")) {
                    bw.print("\"selmaho\":\"" + selmaho + "\",");
                }
                if (rafsi.size() > 0) {
                    bw.print("\"rafsi\":[");
                    for (int i = 0; i < rafsi.size() - 1; i++) {
                        bw.print("\"" + rafsi.get(i) + "\",");
                    }
                    bw.print("\"" + rafsi.get(rafsi.size() - 1) + "\"],");
                }
                bw.print("\"score\":" + score + ",\"definition\":\"" + fixjson(definition) + "\",");
                if (!notes.equals("")) {
                    bw.print("\"notes\":\"" + fixjson(notes) + "\",");
                }
                if (glosswords.size() > 0) {
                    bw.print("\"glosswords\":[");
                    for (int i = 0; i < glosswords.size() - 1; i++) {
                        bw.print("\"" + fixjson(glosswords.get(i)) + "\",");
                    }
                    bw.print("\"" + fixjson(glosswords.get(glosswords.size() - 1)) + "\"]");
                }
                bw.print("},");
            }
        }
        bw.println("];");
        br.close();
        bw.close();
        br = new BufferedReader(new FileReader("temp"));
        bw = new PrintWriter("../jbo.js");
        while ((line = br.readLine()) != null) {
            bw.println(line);
        }
        br.close();
        output.delete();
        bw.close();
        long end = System.currentTimeMillis();
        System.out.println((end - start) + " ms");
    }
    public static String fixjson(String s) {
        return
        // backslashes pain
        s.replaceAll("\"", "\\\\\"").replaceAll("\\\\", "\\\\\\\\")
        // html entities
        .replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&apos;", "'").replaceAll("&quot;", "\\\\\"")
        ;
    }
}