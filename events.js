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
    checkLength();
});
window.addEventListener("scroll", function(e) {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 100) {
        page++;
        load(results, page);
        checkLength();
    }
});
function checkLength() {
    if ((page + 1) * 100 - 1 >= results.length) {
        id("bottom").innerHTML = results.length == 0 ? "" : "no more results";
    }
}
function clearResults() {
    id("results").innerHTML = "";
    id("info").innerHTML = "";
    id("bottom").innerHTML = "";
    id("length").innerHTML = "";
}
var timer;
id("search").addEventListener("input", function() {
    clearTimeout(timer);
    var q = id("search").value;
    if (!regex) q = q.trim().toLowerCase();
    results = null;
    clearResults();
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
                        const lujvo = getLujvo(h(q))[0];
                        id("info").append(mkelem("p", null, [
                            "→ ",
                            mkelem("a", {"href": "?q=" + encodeURIComponent(lujvo)}, 
                                [mkelem("i", null, [lujvo])]
                            )
                        ]));
                    } else {
                        const veljvo = getVeljvo(h(q)).join(" ")
                        id("info").append(mkelem("p", null, [
                            "↑ ",
                            mkelem("a", {"href": "?q=" + encodeURIComponent(veljvo)}, 
                                [mkelem("i", null, [veljvo])]
                            )
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
            clearResults();
            page = 0;
        }
    }, 100);
});
// modes
id("sm").addEventListener("click", searchMode);
id("rm").addEventListener("click", function() {rhymeMode(false);});
id("xm").addEventListener("click", regexMode);
function removeClasses() {
    document.body.classList.remove("rhyme");
    document.body.classList.remove("regex");
}
function addClassById(id, className) {
    id(id).classList.add(className);
}
function removeClassById(id, className) {
    id(id).classList.remove(className);
}
function dispatchSearchInputEvent() {
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function searchMode() {
    clearTimeout(timer);
    removeClasses();
    removeClassById("rm", "checked");
    removeClassById("xm", "checked");
    addClassById("sm", "checked");
    rhyme = false;
    regex = false;
    dispatchSearchInputEvent();
}
function regexMode() {
    clearTimeout(timer);
    removeClasses();
    removeClassById("sm", "checked");
    removeClassById("rm", "checked");
    addClassById("xm", "checked");
    rhyme = false;
    regex = true;
    dispatchSearchInputEvent();
}
function rhymeMode() {
    clearTimeout(timer);
    removeClasses();
    removeClassById("sm", "checked");
    removeClassById("xm", "checked");
    addClassById("rm", "checked");
    rhyme = true;
    regex = false;
    dispatchSearchInputEvent();
}