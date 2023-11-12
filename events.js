const worker = new Worker("worker.js", {"type": "module"});
var rhyme = false;
var regex = false;
let page;
var results;
function h(t) {
    return t.replace(/[h‘’]/igu, "'");
}
worker.addEventListener("message", function(e) {
    results = e.data;
    id("results").innerHTML = "";
    id("length").innerHTML = results.length + " result" + (results.length == 1 ? "" : "s");
    page = 0;
    load(results, page);
    checklength();
});
window.addEventListener("scroll", function(e) {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
        page++;
        load(results, page);
        checklength();
    }
});
function checklength() {
    if ((page + 1) * 100 - 1 >= results.length) {
        id("bottom").innerHTML = results.length == 0 ? "" : "no more results";
    }
}
var timer;
id("search").addEventListener("input", function() {
    clearTimeout(timer);
    var q = id("search").value;
    if (!regex) q = q.trim().toLowerCase();
    results = null;
    id("results").innerHTML = "";
    id("info").innerHTML = "";
    id("length").innerHTML = "";
    id("bottom").innerHTML = "";
    const params = new URLSearchParams({"q": q});
    if (rhyme) params.append("rhyme", "");
    if (regex) params.append("regex", "");
    redir(params);
    timer = setTimeout(function() {
        if (q.length) {
            id("bottom").innerHTML = "loading...";
            if (!rhyme && !regex) {
                // lujvo things
                try {
                    if (/\s/.test(q)) {
                        id("info").append(mkelem("p", null, [
                            "→ ",
                            mkelem("i", null, [getLujvo(h(q))[0]])
                        ]));
                    } else {
                        id("info").append(mkelem("p", null, [
                            "↑ ",
                            mkelem("i", null, [getVeljvo(h(q)).join(" ")])
                        ]));
                    }
                } catch (e) {
                    // not lujvo
                }
            } else if (regex) {
                // bad regex
                try {
                    _ = new RegExp(q);
                } catch (e) {
                    id("info").append(mkelem("p", null, [e.message.split(": ").slice(-1)[0].toLowerCase()]));
                }
            }
            worker.postMessage({"query": q, "rhyme": rhyme, "regex": regex});
        } else {
            results = null;
            id("results").innerHTML = "";
            id("info").innerHTML = "";
            id("bottom").innerHTML = "";
            id("length").innerHTML = "";        
            page = 0;
        }
    }, 100);
});
id("sm").addEventListener("click", searchmode);
id("rm").addEventListener("click", function() {rhymemode(false);});
id("xm").addEventListener("click", regexmode);
// modes
function searchmode() {
    clearTimeout(timer);
    document.body.classList.remove("rhyme");
    document.body.classList.remove("regex");
    id("rm").classList.remove("checked");
    id("xm").classList.remove("checked");
    id("sm").classList.add("checked");
    rhyme = false;
    regex = false;
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function regexmode() {
    clearTimeout(timer);
    document.body.classList.remove("rhyme");
    document.body.classList.add("regex");
    id("sm").classList.remove("checked");
    id("rm").classList.remove("checked");
    id("xm").classList.add("checked");
    rhyme = false;
    regex = true;
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function rhymemode() {
    clearTimeout(timer);
    document.body.classList.remove("regex");
    document.body.classList.add("rhyme");
    id("sm").classList.remove("checked");
    id("xm").classList.remove("checked");
    id("rm").classList.add("checked");
    rhyme = true;
    regex = false;
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
