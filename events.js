const worker = new Worker("worker.js", {"type": "module"});
var config = {};
let page;
var q = "";
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
    if ((!results[0] || results[0][1] != 10) && config["fromwordlink"] && /^[a-g'i-pr-vx-z., ]+$/.test(h(q))) {
        id("length").append(
            createHTMLElement("br", null, []),
            createHTMLElement("a",
                {
                    "href": "https://jbovlaste.lojban.org/dict/" + encodeURIComponent(h(q)),
                    "target": "_blank"
                }, [
                    "check jbovlaste? ↗",
                ]
            ),
            createHTMLElement("br", null, []),
            createHTMLElement("small", null, ["(xlasisku's database is updated weekly)"]),
        );
    }
    config["fromwordlink"] = false;
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
    q = id("search").value;
    if (!config["regex"]) q = q.trim().toLowerCase();
    results = null;
    clearResults();
    redirect();
    timer = setTimeout(function() {
        if (q.length) {
            id("bottom").innerHTML = "loading...";
            if (!config["rhyme"] && !config["regex"]) {
                // lujvo things
                try {
                    if (/\s/.test(q)) {
                        const lujvo = getLujvo(h(q))[0];
                        id("info").append(createHTMLElement("p", null, [
                            "→\u{a0}",
                            createHTMLElement("a", {"href": "?q=" + encodeURIComponent(lujvo)}, 
                            [createHTMLElement("i", null, [lujvo])]
                            )
                        ]));
                    } else {
                        const veljvo = getVeljvo(h(q)).join(" ")
                        id("info").append(createHTMLElement("p", null, [
                            "↑\u{a0}",
                            createHTMLElement("a", {"href": "?q=" + encodeURIComponent(veljvo)}, 
                            [createHTMLElement("i", null, [veljvo])]
                            )
                        ]));
                    }
                } catch (e) {
                    // not lujvo
                }
            } else if (config["regex"]) {
                // bad regex
                try {
                    _ = new RegExp(q);
                } catch (e) {
                    id("info").append(createHTMLElement("p", null, [e.message.split(": ").slice(-1)[0].toLowerCase()]));
                }
            }
            worker.postMessage({"query": q, "config": config});
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
id("rhyme-y").addEventListener("click", function() {rhymeMode(true);});
id("xm").addEventListener("click", function() {regexMode(false, false);});
id("regex-i").addEventListener("click", function() {regexMode(true, false);});
id("regex-tight").addEventListener("click", function() {regexMode(false, true);});
function removeClasses() {
    document.body.classList.remove("rhyme");
    document.body.classList.remove("regex");
}
function setBodyClass(className) {
    document.body.classList.add(className);
}
function addClassById(_id, className) {
    id(_id).classList.add(className);
}
function removeClassById(_id, className) {
    id(_id).classList.remove(className);
}
function toggleClassById(_id, className) {
    if (id(_id).classList.contains(className))
        id(_id).classList.remove(className);
    else
        id(_id).classList.add(className);
}
function dispatchSearchInputEvent() {
    id("search").dispatchEvent(new Event("input", {"bubbles": true}));
}
function wrapSearchbar(before, after) {
    id("before").innerHTML = before;
    id("after").innerHTML = after;
}
function searchMode() {
    clearTimeout(timer);
    removeClasses();
    removeClassById("rm", "checked");
    removeClassById("xm", "checked");
    addClassById("sm", "checked");
    config["rhyme"] = false;
    config["regex"] = false;
    wrapSearchbar("<wbr />", "<wbr />");
    dispatchSearchInputEvent();
}
function regexMode(togglei, toggletight) {
    clearTimeout(timer);
    removeClasses();
    setBodyClass("regex");
    removeClassById("sm", "checked");
    removeClassById("rm", "checked");
    addClassById("xm", "checked");
    config["rhyme"] = false;
    config["regex"] = true;
    if (togglei) {
        toggleClassById("regex-i", "checked");
        config["regex.insensitive"] = !config["regex.insensitive"];
    }
    if (toggletight) {
        toggleClassById("regex-tight", "checked");
        config["regex.tight"] = !config["regex.tight"];
    }
    wrapSearchbar(
        "/" + (config["regex.tight"] ? "^" : ""),
        (config["regex.tight"] ? "$" : "") + "/" + (config["regex.insensitive"] ? "i" : "")
    );
    dispatchSearchInputEvent();
}
function rhymeMode(toggle) {
    clearTimeout(timer);
    removeClasses();
    setBodyClass("rhyme");
    removeClassById("sm", "checked");
    removeClassById("xm", "checked");
    addClassById("rm", "checked");
    config["rhyme"] = true;
    config["regex"] = false;
    wrapSearchbar("<wbr />", "<wbr />");
    if (toggle) {
        toggleClassById("rhyme-y", "checked");
        config["rhyme.ignorey"] = !config["rhyme.ignorey"];
    }
    dispatchSearchInputEvent();
}