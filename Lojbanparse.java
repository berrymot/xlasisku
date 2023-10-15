import java.io.*;
import java.util.*;
public class Lojbanparse {
    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();
        BufferedReader br = new BufferedReader(new FileReader("jvs/jbovlaste-en.xml"));
        File output = new File("temp");
        if (output.exists()) {
            output.delete();
        }
        output.createNewFile();
        File data = new File("min/data.txt");
        if (data.exists()) {
            data.delete();
        }
        PrintWriter bw = new PrintWriter("temp");
        PrintWriter dw = new PrintWriter("min/data.txt");
        bw.print("const jbo=[");
        String line;
        while ((line = br.readLine()) != null) {
            if (!line.contains("<valsi") && !line.contains("</valsi>")) {
                continue;
            }
            if (line.contains("<valsi")) {
                String word = line.substring(line.indexOf("word=\"") + 6, line.indexOf("\"", line.indexOf("word=\"") + 6));
                String type = line.substring(line.indexOf("type=\"") + 6, line.indexOf("\"", line.indexOf("type=\"") + 6));
                if (type.startsWith("obs")) {
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
                line = br.readLine();
                String author = line.substring(line.indexOf("<username>") + 10, line.indexOf("</username>"));
                while (!line.contains("<definition>")) {
                    line = br.readLine();
                }
                String definition = "";
                definition = line.substring(line.indexOf("<definition>") + 12, line.indexOf("</definition>"));
                line = br.readLine();
                line = br.readLine();
                String score = line.substring(line.indexOf("<score>") + 7, line.indexOf("</score>"));
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
                dw.print("---\n" + String.join("_", word.split(" ")) + " " + String.join("_", type.split(" ")) + " ");
                if (!selmaho.equals("")) {
                    bw.print("\"selmaho\":\"" + selmaho + "\",");
                    dw.print(selmaho + " ");
                }
                if (rafsi.size() > 0) {
                    bw.print("\"rafsi\":[");
                    dw.print("[");
                    for (int i = 0; i < rafsi.size() - 1; i++) {
                        bw.print("\"" + rafsi.get(i) + "\",");
                        dw.print("-" + rafsi.get(i));
                    }
                    bw.print("\"" + rafsi.get(rafsi.size() - 1) + "\"],");
                    dw.print("-" + rafsi.get(rafsi.size() - 1) + "-] ");
                }
                dw.println(author.toLowerCase().replaceAll("_", "") + " " + score);
                bw.print("\"score\":" + score + ",\"definition\":\"" + fixjson(definition) + "\",");
                dw.println(fixdata(definition));
                if (!notes.equals("")) {
                    bw.print("\"notes\":\"" + fixjson(notes) + "\",");
                    dw.println("-n\n" + fixdata(notes));
                }
                if (glosswords.size() > 0) {
                    bw.print("\"glosswords\":[");
                    dw.println("-g");
                    for (int i = 0; i < glosswords.size() - 1; i++) {
                        bw.print("\"" + fixjson(glosswords.get(i)) + "\",");
                        dw.println(fixdata(glosswords.get(i)));
                    }
                    bw.print("\"" + fixjson(glosswords.get(glosswords.size() - 1)) + "\"]");
                    dw.println(fixdata(glosswords.get(glosswords.size() - 1)));
                }
                bw.print("},");
            }
        }
        bw.println("];");
        dw.println("---");
        br.close();
        bw.close();
        dw.close();
        br = new BufferedReader(new FileReader("temp"));
        bw = new PrintWriter("jbo.js");
        while ((line = br.readLine()) != null) {
            bw.println(line);
        }
        br.close();
        File temp = new File("temp");
        temp.delete();
        bw.close();
        long end = System.currentTimeMillis();
        System.out.println("XML parsing complete.");
        System.out.println("Time elapsed: " + (end - start) + " ms");
    }
    public static String fixjson(String s) {
        return
        // backslashes pain
        s.replaceAll("\"", "\\\\\"").replaceAll("\\\\", "\\\\\\\\")
        // html entities
        .replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&apos;", "'").replaceAll("&quot;", "\\\\\"")
        ;
    }
    public static String fixdata(String s) {
        return
        // html entities
        s.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&apos;", "'").replaceAll("&quot;", "\"")
        ;
    }
}