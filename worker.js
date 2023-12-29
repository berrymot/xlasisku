import {jbo} from "./data/jbo.js";
var config, rafsilist;
function h(t) {
    return t.replace(/[h‘’]/igu, "'");
}
// TODO: selmaho() - parse into ↓
function selmahois(x, y) {
    const [xname, xdigit, xsub, xstar] = x;
    const [yname, ydigit, ysub, ystar] = y;
    return xname == yname && (xdigit == ydigit || xdigit == null) && (xsub == ysub || xsub == null) && (!xstar || ystar);
}
function getVowelsFrom(str) {
    var vowels = str.toLowerCase();
    vowels = vowels.replace(/(?<=[aeoy])i/g, "ĭ").replace(/(?<=[aeoy])u/g, "ŭ");
    while (/[iu]/.test(vowels)) {
        vowels = vowels
        .replace(/i(?![aeiouyīū])/gu, "ī").replace(/u(?![aeiouyīū])/gu, "ū")
        .replace(/i(?=[aeoyīū])/gu, "ị").replace(/u(?=[aeīoūy])/gu, "ụ");
    }
    if (config["rhyme.ignorey"])
        vowels = vowels.replace(/[^aeiouĭŭīūịụ]/gu, "");
    else
        vowels = vowels.replace(/[^aeiouyĭŭīūịụ]/gu, "");
    return vowels;
}
function xusegismu_zo(g) {
    return /^[bcdfgjklmnprstvxz]([aeiou][bcdfgjklmnprstvxz]|[bcdfgjklmnprstvxz][aeiou])[bcdfgjklmnprstvxz][aeiou]$/.test(g);
}
function search(query) {
    const original = query;
    if (!config["regex"]) {
        query = query.toLowerCase();
    }
    var results = [];
    if (config["rhyme"]) {
        const v = getVowelsFrom(query);
        for (const entry of jbo) {
            var text = getVowelsFrom(entry.word);
            if (v != "" && text.endsWith(v)) {
                results.push([entry, v.length - text.length]);
            }
        }
    } else if (config["regex"]) {
        var rgx;
        try {
            rgx = new RegExp(
                config["regex.tight"] ? "^" + query + "$" : query,
                config["regex.insensitive"] ? "i" : ""
            );
        } catch (e) {
            return [];
        }
        for (const entry of jbo) {
            if (rgx.test(entry.word)) {
                results.push([entry, 1]);
            }
        }
    } else if (/^[A-GI-PR-VX-Z][A-GhI-PR-VX-Zabc0-9*]*$/.test(original)) {
        // TODO: make this work (issue #1)
    } else {
        // exact matches
        for (const w of query.split(/[\s.]+/)) {
            const exact = jbo.find(entry => entry.word.toLowerCase().replace(/\./g, "") == h(w));
            if (exact) {
                results.push([exact, 10]);
            }
        }
        for (const entry of jbo) {
            const bonus = (entry.score >= 1000 ? 0.375 : 0) + (xusegismu_zo(entry.word) ? 0.125 : 0);
            var score = 4;
            if (rafsilist.get(entry.word) && rafsilist.get(entry.word).includes(h(query))) {
                results.push([entry, score]);
            }
            score = 3;
            const rgx = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = `\\b${rgx}e?s?\\b`; // doi la bavyse'i ko ba'e *na* galfi ti. you tried that like 4,0000 times
            if (new RegExp(regex, "iu").test(entry.definition)) {
                results.push([entry, score + bonus]);
            }
            score = 2;
            if (entry.word.toLowerCase().startsWith(h(query))) {
                results.push([entry, score + 0.5]);
            } else if (entry.word.toLowerCase().includes(h(query))) {
                results.push([entry, score]);
            }
            score = 1;
            if (entry.notes && new RegExp(regex, "iu").test(entry.notes)) {
                results.push([entry, score + bonus]);
            }
        }
    }
    results = removeDuplicates(results);
    return results;
}
function removeDuplicates(list) {
    var sortedList = list.sort((a, b) => b[1] - a[1]);
    const logged = {};
    sortedList = sortedList.filter(entry => {
      if (logged[entry[0].word]) return false;
      logged[entry[0].word] = true;
      return true;
    });
    return sortedList;
}
onmessage = function(e) {
    const query = e.data.query;
    config = e.data.config;
    rafsilist = e.data.rafsilist;
    const res = search(query);
    postMessage(res);
};