import {jbo} from "./jbo.js";
var rhyme, regex;
function h(t) {
    return t.replace(/[h‘’]/igu, "'");
}
function fields(json) {
    return [json.selmaho || null, json.rafsi || null, json.definition, json.word, json.glosswords || null, json.notes || null];
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
    
    vowels = vowels.replace(/[^aeiouyĭŭīūịụ]/gu, "");
    return vowels;
}
function xusegismu_zo(g) {
    return /^[bcdfgjklmnprstvxz]([aeiou][bcdfgjklmnprstvxz]|[bcdfgjklmnprstvxz][aeiou])[bcdfgjklmnprstvxz][aeiou]$/.test(g);
}
function search(query) {
    var results = [];
    if (rhyme) {
        const v = getVowelsFrom(query);
        for (const entry of jbo) {
            var text = getVowelsFrom(entry.word);
            if (v != "" && text.endsWith(v)) {
                results.push([entry, -entry.word.length]);
            }
        }
    } else if (regex) {
        for (const entry of jbo) {
            var rgx;
            try {
                rgx = new RegExp(query);
            } catch (e) {
                return [];
            }
            if (rgx.test(entry.word)) {
                results.push([entry, 1]);
            }
        }
    } else {
        // exact matches
        for (const w of query.split(/\s+/)) {
            const exact = jbo.find(entry => entry.word == h(w));
            if (exact) {
                results.push([exact, 10]);
            }
        }
        for (const entry of jbo) {
            for (var field of fields(entry)) {
                var score = 6 - fields(entry).indexOf(field);
                const gismubonus = xusegismu_zo(entry.word) ? 0.5 : 0;
                switch (field) {
                    case entry.word:
                        if (field.startsWith(h(query))) {
                            results.push([entry, score + 0.5 + query.length / field.length / 2]);
                        } else if (field.includes(h(query))) {
                            results.push([entry, score + query.length / field.length / 2]);
                        }
                        break;
                    case entry.rafsi:
                        if (field) {
                            score = 8;
                            for (const r of field) {
                                if (r == h(query)) {
                                    results.push([entry, score]);
                                }
                            }
                        }
                        break;
                    case entry.selmaho:
                        // const bits = selmaho(query);
                        // console.log(bits);
                        // if (field) {
                        //     if (selmahois(bits, selmaho(field))) {
                        //         results.push([html, score]);
                        //     }
                        // }
                        break;
                    case entry.glosswords:
                        if (field) {
                            for (const g of field) {
                                if (g == query) {
                                    results.push([entry, gismubonus]);
                                }
                            }
                        }
                        break;
                    default:
                        const rgx = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        if (field && new RegExp(`\\b${rgx}e?s?\\b`, "iu").test(field)) {
                            results.push([entry, score + gismubonus]);
                        }
                        break;
                }
            }
        }
    }
    results = removeDuplicates(results);
    return results;
}
function removeDuplicates(list) {
    var sortedList = list.sort((a, b) => b[1] - a[1]);  // Sort the list in descending order based on the second element of each entry
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
    rhyme = e.data.rhyme || false;
    regex = e.data.regex || false;
    const res = search(query);
    postMessage(res);
};