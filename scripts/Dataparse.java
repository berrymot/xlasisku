package scripts;
import java.util.*;
import java.io.*;
public class Dataparse {
    public static void main(String[] args) throws Exception {
        System.out.print("dataparse   ");
        long start = System.currentTimeMillis();
        BufferedReader read = new BufferedReader(new FileReader("../min/data.txt"));
        File jsonfile = new File("../min/data.json");
        if (jsonfile.exists()) jsonfile.delete();
        PrintWriter jsonwrite = new PrintWriter(new FileWriter(jsonfile));
        // parsing
        jsonwrite.print("[");
        String line = read.readLine();
        ArrayList<String> errors = new ArrayList<>();
        while (line != null) {
            if (line.equals("---")) {
                line = read.readLine();
                if (line == null) break;
                // word line
                String[] wordline = line.split(" ");
                String word = wordline[0].replaceAll("_", " "), pos = null, cat = null, rafsi = null, author = null, score = null;
                String[] rafsilist = null;
                ArrayList<String> defns = new ArrayList<>();
                ArrayList<String> notes = new ArrayList<>();
                if (word.matches("[^a-g'i-pr-vxyz., ]|[cfkpstx][bdgjvz]|[bdgjvz][cfkpstx]|[cjsz]{2}|[ck]x|x[ck]|mz|nt[cs]|nd[jz]")) {
                    errors.add(word + ": Not a word");
                }
                if (wordline.length < 4) {
                    errors.add(word + ": Not enough word-line fields");
                    // break;
                } else if (wordline.length <= 6) {
                    String[] poslist = {"cmavo", "fu'ivla", "cmevla", "lervla", "zei-lujvo", "gismu", "lujvo"};
                    if (!Arrays.asList(poslist).contains(wordline[1])) {
                        errors.add(word + ": Unrecognized part of speech");
                        // break;
                    } else {
                        pos = wordline[1];
                    }
                    if (!wordline[wordline.length - 2].matches("^[-a-z0-9]+$")) {
                        errors.add(word + ": Bad/missing author name");
                        // break;
                    } else {
                        author = wordline[wordline.length - 2].toLowerCase();
                    }
                    if (!wordline[wordline.length - 1].matches("^(-?\\d+|official)$")) {
                        errors.add(word + ": Bad/missing score");
                        // break;
                    } else {
                        score = wordline[wordline.length - 1].toLowerCase();
                    }
                    if (wordline.length == 5) {
                        if (!wordline[2].matches("(^[A-Zh]+\\*?\\d?[a-z]?(\\+[A-Zh]+\\*?\\d?[a-z]?)?$)|(^\\[(-[a-z']+)+-\\]$)")) {
                            errors.add(word + ": Bad selma'o or rafsi list");
                            // break;
                        } else if (wordline[2].matches("^[A-Zh]+\\*?\\d?[a-z]?(\\+[A-Zh]+\\*?\\d?[a-z]?)?$")) {
                            cat = wordline[2];
                        } else if (wordline[2].matches("^\\[(-[a-z']+)+-\\]$")) {
                            rafsi = wordline[2];
                            rafsilist = rafsi.substring(2, rafsi.length() - 2).split("-");
                            // chop 2 characters off both sides, split into list
                            // "[-blo-lot-lo'i-]" → {"blo", "lot", "lo'i"}
                        }
                    }
                    if (wordline.length == 6) {
                        if (!wordline[2].matches("^[A-Zh]+\\*?\\d?[a-z]?(\\+[A-Zh]+\\*?\\d?[a-z]?)?$")) {
                            errors.add(word + ": Bad selma'o");
                            // break;
                        } else {
                            cat = wordline[2];
                        }
                        if (!wordline[3].matches("^\\[(-[a-z']+)+-\\]$")) {
                            errors.add(word + ": Bad rafsi list");
                            // break;
                        } else {
                            rafsi = wordline[3];
                            rafsilist = rafsi.substring(2, rafsi.length() - 2).split("-");
                        }
                    }
                } else {
                    errors.add(word + ": Too many word-line fields");
                    // break;
                }
                // definitions
                line = read.readLine();
                while (!Arrays.asList(new String[]{"-n", "---"}).contains(line)) {
                    defns.add(line);
                    line = read.readLine();
                }
                if (line.equals("-n")) {
                    // notes
                    line = read.readLine();
                    while (!line.equals("---")) {
                        notes.add(line);
                        line = read.readLine();
                    }
                }
                // if (line.equals("-g")) {
                //     // gloss
                //     line = read.readLine();
                //     while (!line.equals("---")) {
                //         gloss.add(line);
                //         line = read.readLine();
                //     }
                // }
                // writing
                jsonwrite.print("{\"word\":\"" + word + "\",");
                jsonwrite.print("\"pos\":\"" + pos + "\",");
                if (cat != null) {
                    jsonwrite.print("\"selmaho\":\"" + cat + "\",");
                }
                if (rafsilist != null) {
                    jsonwrite.print("\"rafsi\":[");
                    for (int i = 0; i < rafsilist.length; i++) {
                        jsonwrite.print("\"" + rafsilist[i] + "\",");
                    }
                    jsonwrite.print("],");
                }
                jsonwrite.print("\"author\":\"" + author + "\",");
                jsonwrite.print("\"score\":\"" + score + "\",");
                if (defns.size() != 0) {
                    jsonwrite.print("\"definitions\":[");
                    for (int i = 0; i < defns.size(); i++) {
                        jsonwrite.print("\"" + defns.get(i) + "\",");
                    }
                    jsonwrite.print("],");
                }
                if (notes.size() != 0) {
                    jsonwrite.print("\"notes\":[");
                    for (int i = 0; i < notes.size(); i++) {
                        jsonwrite.print("\"" + notes.get(i) + "\",");
                    }
                    jsonwrite.print("],");
                }
                jsonwrite.print("},");
            }
        }
        jsonwrite.print("]");
        read.close();
        jsonwrite.close();
        File err = new File("../min/data-errors.txt");
        if (err.exists()) err.delete();
        PrintWriter errw = new PrintWriter(err);
        for (String s : errors) {
            errw.println(s);
        }
        errw.close();
        long end = System.currentTimeMillis();
        System.out.println((end - start) + " ms");
    }
}