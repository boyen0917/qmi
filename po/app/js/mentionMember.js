
function getCaretPosition(element) {
    if (window.getSelection && window.getSelection().getRangeAt) {
        var range = window.getSelection().getRangeAt(0);
        var tmpElement = document.createElement("div");
        var selectedObj = window.getSelection();
        var textBeforeCaret = range.startContainer.textContent.substring(0, range.startOffset);
        var rangeCount = 0;
        var childNodes = selectedObj.anchorNode.parentNode.childNodes;

        tmpElement.textContent = textBeforeCaret;
        rangeCount += tmpElement.innerHTML.length;
        
        for (var i = 0; i < childNodes.length; i++) {
            if (childNodes[i] == selectedObj.anchorNode) {
                break;
            }
            if (childNodes[i].outerHTML) {
                // console.log("dwdwkkk");
                rangeCount += childNodes[i].outerHTML.length;
            }
            else if (childNodes[i].nodeType == 3) {
                tmpElement.textContent = childNodes[i].textContent;
                rangeCount += tmpElement.innerHTML.length;
                // rangeCount += childNodes[i].textContent.length;
            }
        }

        return rangeCount;
        // return range.startOffset + rangeCount;
    }

    return -1;
}

function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
    }
}


function getSelectedMarkNodes(range) {
    var node = range.startContainer;
    var endNode = range.endContainer;

    // Special case for a range that is contained within a single node
    if (node == endNode) {
        return [node];
    }

    // Iterate nodes until we hit the end container
    var rangeNodes = [];
    while (node && node != endNode) {
        node = nextNode(node);
        if (node.nodeName == "MARK") {
            rangeNodes.push(node);
        }
    }

    // Add partially selected nodes at the start of the range
    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        if (node.nodeName == "MARK") {
            rangeNodes.unshift(node);
        }
        
        node = node.parentNode;
    }

    return rangeNodes;
}

// 找尋所有mark裡面的text，如被更改就把mark拿掉
function delUncompleteMark(element, caretPosition) {
    var markList = element.find("mark");
    var selectionObj = window.getSelection();
    var currentNode = selectionObj.anchorNode;
    var range = document.createRange();
    var everUnwrapMark = false;

    if (markList.length) {
        $.each(markList, function(i, markElement) {
            var markMemberID = $(markElement).attr("id");
            var markName = $(markElement).attr("name");
            if (markElement.textContent != markName) {
                everUnwrapMark = true;
                $(markElement.firstChild).unwrap();

                element.data("memberList")[markMemberID] = {
                    nk: markName,
                    aut: element.data("markMembers")[markMemberID].mugshot,
                };
                delete element.data("markMembers")[markMemberID];
            }
        });

        // unwrap任何一個mark都會造成游標亂移動，故這裡會再調整游標正確的位置
        if (everUnwrapMark) {
            //如果前一個sibling元素里內容是換行字，游標設定目前node裡的第1個字
            if (currentNode.previousSibling.textContent == "\n") {
                range.setStart(currentNode, 0);
            } else {
                // 游標設定在當初focus的位置
                range.setStart(currentNode, caretPosition);
            }
            range.collapse(true);
            selectionObj.removeAllRanges();
            selectionObj.addRange(range);
        }
    }
}