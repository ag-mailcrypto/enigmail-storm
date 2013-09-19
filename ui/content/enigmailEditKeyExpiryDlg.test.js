/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "MPL"); you may not use this file
 * except in compliance with the MPL. You may obtain a copy of
 * the MPL at http://www.mozilla.org/MPL/
 *
 * Software distributed under the MPL is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the MPL for the specific language governing
 * rights and limitations under the MPL.
 *
 * The Original Code is Enigmail.
 *
 * The Initial Developer of the Original Code is Marius Stübs.
 * Portions created by Marius Stübs <marius.stuebs@riseup.net> are
 * Copyright (C) 2013 Marius Stübs. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * ***** END LICENSE BLOCK ***** */

var requiredAddons = ['{847b3a00-7ab1-11d4-8f02-006008948af5}'];
                      
var description = "Testcase for Enigmail's Key Import and Delete Function";
var parallel = false;

var testKey = {}
testKey.id = "FDF633A2";
var keyManagerDialog;
var editKeyExpiryDialog;

function setUp() {
  /**
   * This function is always processed before each test.
   */
  openExpiryDlgWithTestKey();
}

function tearDown() {
  // This function is always processed after each test.
  getEditKeyExpiryDialog().close();
  yield 100; // Wait for the close-action to comlete.
}

/**
 * This function is processed only once before tests.
 */
function startUp() {
   openKeyManagerDlg();
   importTestKey();
}

/**
 * This function is processed only once after all tests finish.
 */
function shutDown() { 
  keyManagerDialog.close();
}

var getEditKeyExpiryDialog = function() {
  if (editKeyExpiryDialog) {
    return editKeyExpiryDialog;
  } else {
    return keyManagerDialog.hasChildWindow.reference;
  }
}

/**
 * Open the key manager and make it's reference globally available.
 */
function openKeyManagerDlg() {
  // Open the key manager dialog
  keyManagerDialog = openDialogAndWaitForIt(window, "enigmailKeyManager");
}

/**
 * The test key must be imported, before the tests work.
 */
function importTestKey() {
  // deleteTestKey();
  // The import action!
  var errorMsgObj = {};
  var interactive = false;
  var enigmailSvc = keyManagerDialog.GetEnigmailSvc();
  var exitCode = enigmailSvc.importKey(
                    keyManagerDialog, 
                    interactive, 
                    testKey.publicBlock + "\n" + testKey.privateBlock, 
                    "", errorMsgObj);
  assert.equals(0, exitCode);
}

/**
 * Using the reference to key manager window, search for the testkey, open the expiry dialog 
 * and make it's reference globally available.
 */
function openExpiryDlgWithTestKey() {
  // After opening the key manager dialog, select the filter input field.
  var keyFilterInput = keyManagerDialog.document.getElementById("filterKey");
  assert.equals("search", keyFilterInput.type);   // One arbitrary check.

  // Wait the timeout for the key list to be loaded
  utils.wait(function() {return keyManagerDialog.document.getElementById("progressBar").collapsed;	});

  // Enter our test key ID.
  keyFilterInput.focus();
  action.inputTo(keyFilterInput, testKey.id);

  // Wait the timeout for the filter function to start.
  var timeout = parseInt(keyFilterInput.timeout);
  utils.wait(timeout);
  
  // Wait until the filter function is applied and valid results are available.
  var node;
  while (node === undefined || node === null) {
    node = keyManagerDialog.getFirstNode();
    utils.wait(100);
  }

  // All keys in the list are hidden, but the one which we are searching for.
  while (node.hidden === true) {
    node = node.nextSibling;
  }
  var fetchedKey = node;

  assert.equals(testKey.id, fetchedKey.id.substring(8));
  gTreeListChildren = keyManagerDialog.document.getElementById(fetchedKey.id);

  
  // Select the testKey and doubleclick the list
  gUserList = keyManagerDialog.document.getElementById("pgpKeyList");
  gUserList.view.selection.select(0);

  // Fork the process of the modal dialog
  setTimeout(function() {
    // action.dblclickOn(gUserList);
    keyManagerDialog.enigEditKeyExpiry();
  }, 10);
}


/**
 * 
 */
//testXulElementAvailability.description = 'One hell of a test.';
testXulElementAvailability.priority = 'must';
function testXulElementAvailability() {
  // Get the editKeyExpiryDialog. If it's not opened yet, give it some time.
  do {
    yield 50;
    var editKeyExpiryDialog = getEditKeyExpiryDialog();
  } while (!editKeyExpiryDialog);
  
  
  
  //global editKeyExpiryDialog;
  assert.equals("chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul", editKeyExpiryDialog.location);
  assert.isTrue(editKeyExpiryDialog.document);

  // Get the list of subkeys and check if it is valid.
  var treeChildren = editKeyExpiryDialog.document.getElementById("keyListChildren");

  assert.isTrue(true);
}


/**
 * Test the behaviour on invalid configuration.
 * 
 * for acceptDialog() 
 * @see https://developer.mozilla.org/en-US/docs/XUL/dialog#p-defaultButton
 * @see https://developer.mozilla.org/en-US/docs/XUL/dialog
 * @see https://developer.mozilla.org/en/docs/Dialogs_in_XULRunner 
 */
testInvalidExpirationDateInput.priority = 'must';
testInvalidExpirationDateInput.parameters = [
  {value: '-1', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: '0', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: '7.5', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: '7,5', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: 'xyz', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: '99999', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
  {value: '12 34', expected: "chrome://enigmail/content/enigmailEditKeyExpiryDlg.xul"},
];
function testInvalidExpirationDateInput(aParameter) {
  // Get the editKeyExpiryDialog. If it's not opened yet, give it some time.
  do {
    yield 100;
    var editKeyExpiryDialog = getEditKeyExpiryDialog();
  } while (!editKeyExpiryDialog);
  assert.isTrue(editKeyExpiryDialog.EnigmailCommon);
  var Ec = editKeyExpiryDialog.EnigmailCommon;
  alertBackup = Ec.alert;
  
  // Set the counter, how many alert messages pop up.
  // Override the alert method to implement a counter.
  alertCount = 0;
  editKeyExpiryDialog.Ec.alert = function() {  alertCount++; };

// 2x ENTER
// Expect only 1 Alert window.
  noExpiry = editKeyExpiryDialog.document.getElementById("noExpiry");
  noExpiry.checked = "1";
  noExpiry.click();
  expireInput = editKeyExpiryDialog.document.getElementById("expireInput");
  expireInput.value = aParameter.value;
  yield 100;

  editKeyExpiryDialog.document.getElementById("expireInput").onchange();
  editKeyExpiryDialog.document.getElementById("enigmailEditKeyExpiryDlg").acceptDialog();
  editKeyExpiryDialog.document.getElementById("enigmailEditKeyExpiryDlg").acceptDialog();
  yield 20; // the alert count has a delay of some ms, so we'll wait for it ;-)
  assert.equals(1, alertCount);

  // Wait 50ms and then again hit the SUBMIT-Button.
  yield 50;
  editKeyExpiryDialog.gAlertPopUpIsOpen = false;
  editKeyExpiryDialog.document.getElementById("enigmailEditKeyExpiryDlg").acceptDialog();
  yield 20; // the alert count has a delay of some ms, so we'll wait for it ;-)
  assert.equals(2, alertCount);

  // Make sure, that the dialog is still opened.
  assert.equals(aParameter.expected, true && editKeyExpiryDialog.location);

  // Re-set the Alert-Dialog!
  editKeyExpiryDialog.EnigmailCommon.alert = alertBackup;
  editKeyExpiryDialog.Ec.alert = alertBackup;
}


/**
 * Test the behaviour on valid arguments.
 */
testValidExpirationDateInput.priority = 'must';
testValidExpirationDateInput.description = 'Test the behaviour on valid arguments';
testValidExpirationDateInput.parameters = [
  {selectedKeys: [0,1], expireInput: 1, timeScale: '365', noExpiry: true},
  {selectedKeys: [1,2], expireInput: 1, timeScale: '30',  noExpiry: true},
  {selectedKeys: [2,0], expireInput: 1, timeScale: '1',   noExpiry: false},
  {selectedKeys: [0,2], expireInput: 2, timeScale: '365', noExpiry: false},
  {selectedKeys: [0,1], expireInput: 3, timeScale: '30',  noExpiry: false},
  {selectedKeys: [1,2], expireInput: 4, timeScale: '1',   noExpiry: false},
];
function testValidExpirationDateInput(aParameter) {
  // Get the editKeyExpiryDialog. If it's not opened yet, give it some time.
  do {
    yield 100;
    var editKeyExpiryDialog = getEditKeyExpiryDialog();
  } while (!editKeyExpiryDialog);
  assert.isTrue(editKeyExpiryDialog.EnigmailCommon);
  
  // Set the tested values
  expireInput = editKeyExpiryDialog.document.getElementById("expireInput");
  expireInput.value = aParameter.expireInput;
  timeScale = editKeyExpiryDialog.document.getElementById("timeScale");
  timeScale.value = aParameter.timeScale;
  setSelectedSubkeys(editKeyExpiryDialog,aParameter.selectedKeys);
  noExpiry = editKeyExpiryDialog.document.getElementById("noExpiry");
  noExpiry.checked = aParameter.noExpiry ? "" : "1";
  noExpiry.click();
  yield 200;
  
//  editKeyExpiryDialog.document.getElementById("enigmailEditKeyExpiryDlg").acceptDialog();
}



/**
 * This helper function opens a dialog window and waits for it to load completely,
 *
 * @param Window The parent window
 * @param String The XUL file name (without appendix ".xul") to be opened.
 * 
 * @return The completely loaded Window Object
 */
function openDialogAndWaitForIt(win, dialogName) {
   var dialog = win.openDialog(
            "chrome://enigmail/content/"+dialogName+".xul");
            // 'chrome://browser/content/browser.xul');

  dialog.isUnitTest = true;
  dialog.hasChildWindow = {value : false, reference : null };

  var loaded = { value : false };
  dialog.addEventListener('load', function() {
    dialog.EnigmailCommon.DEBUG_LOG("enigmailKeyManager.js: 'loaded'");
    loaded.value = true;
  }, false);
  // Wait until the flag is set to true.
  utils.wait(loaded);
  return dialog;
}



/**
 * 
 *
 * @param  Array  The indexes of the to-be selected subkeys. 0 is the main key.
 */
function setSelectedSubkeys(win, selectedSubKeys) {
//  Ec.DEBUG_LOG("testEnigmailEditKeyExpiry: setSelectedSubkeys()\n");

  var keySelList   = win.document.getElementById("subkeyList");
  var treeChildren = keySelList.getElementsByAttribute("id", "keyListChildren")[0];
  var item=treeChildren.firstChild;
  
  var subkeyNumber = 0;
  
  while (item) {
    var aRows = item.getElementsByAttribute("id","indicator");
    if (aRows.length) {
      var elem=aRows[0];
      if (selectedSubKeys.indexOf(subkeyNumber) > -1) {
        win.EnigSetActive(elem, 1);
        assert.equals("1", elem.getAttribute("active"));
      } else {
        if (elem.getAttribute("active") == "1" || elem.getAttribute("active") == "0") {
          win.EnigSetActive(elem, 0);
          assert.equals("0", elem.getAttribute("active"));
        } else {
          assert.equals("-1", elem.getAttribute("active"));
        }
      }
    }
    subkeyNumber += 1;
    item = item.nextSibling;
  }
}


/** 
 * Open the key details dialog, using the keyManagerDialog
 *
 * It filters the list of keys by the testKey.id and then double clicks on the result.
 * 
 * @param WindowObject keyManagerDialog  The opened dialog window for key management.
 *
 * @return void 
 */
function openKeyDetailsDlgWithTestKey(keyManagerDialog) {
  // After opening the key manager dialog, select the filter input field.
  var keyFilterInput = keyManagerDialog.document.getElementById("filterKey");
  assert.equals("search", keyFilterInput.type);   // One arbitrary check.

  // Wait the timeout for the key list to be loaded
  utils.wait(function() {return keyManagerDialog.document.getElementById("progressBar").collapsed;	});
  
  // Enter our test key ID.
  keyFilterInput.focus();
  action.inputTo(keyFilterInput, testKey.id);

  // Wait the timeout for the filter function to start.
  var timeout = parseInt(keyFilterInput.timeout);
  utils.wait(timeout);
  
  // Wait until the filter function is applied and valid results are available.
  var node;
  while (node === undefined || node === null) {
    node = keyManagerDialog.getFirstNode();
    utils.wait(100);
  }

  // All keys in the list are hidden, but the one which we are searching for.
  while (node.hidden === true) {
    node = node.nextSibling;
  }
  var fetchedKey = node;

  assert.equals(testKey.id, fetchedKey.id.substring(8));
  gTreeListChildren = keyManagerDialog.document.getElementById(fetchedKey.id);

  
  // Select the testKey and doubleclick the list
  gUserList = keyManagerDialog.document.getElementById("pgpKeyList");
  gUserList.view.selection.select(0);

  // Fork the process of the modal dialog
  setTimeout(function() {
    action.dblclickOn(gUserList);
  }, 10);
}

/**
 * Return the child dialog window
 * 
 * @param   windowObject  The parent window, normally keyManagerDialog
 * @return  windowObject  If the global variable childDialog is set, return it. 
 *                        If not, return the variable "hasChildWindow".
 */
function getChildDialog(currentWindow) {
  if (!childDialog) {
    childDialog = currentWindow.hasChildWindow.reference;
  }
  return childDialog;
}

testKey.publicBlock = '-----BEGIN PGP PUBLIC KEY BLOCK-----\n\
Version: GnuPG v1.4.13 (GNU/Linux)\n\
\n\
mQENBFHsE4QBCAC1rY/rjnYgIF/t2R7Pn+S2LMUtFbyJR/LWqC8+wTBo2Y34YH58\n\
PlQVSKq4OXSRuSU1L9bHI15MXOp2Kx6PQV5+Yi/m/rybq/MX/RazUkaiXFrDt77B\n\
fJjuPcGF3JOFQoSfrbvsCiHWhFcuPfOeiDhis1yPXpi49Ip0KE7CXkKbvzxIZq1x\n\
elChwuMuiq0ge8FXH0Fv5SglfU+mrq3CSrJ3uk7olj3WYS6F+EiEKOIjU5DWyjZ+\n\
S3PwJBy05BEqZbACx8ZfPnS1fvoYovauzOVQpiK8R/39q+MeVyUQTEUTKiWalpyh\n\
jeJwY9q2/m6zYAYGygtQK4TyTSXYTgIJKofvABEBAAG0IUxvYmlzb21lbSA8bG9i\n\
aXNvbWVtQGV4YW1wbGUuY29tPokBQQQTAQIAKwIbIwYLCQgHAwIGFQgCCQoLBBYC\n\
AwECHgECF4ACGQEFAlIx2j8FCQIm+jsACgkQjRjrIv32M6KnGgf/TBMs0BZitlV6\n\
ZssSOQNg8fTpNuNo+8maHd7gioOM3PXXVPdVvYC42lzWNesRz2wEnP8RSDP62mBn\n\
LgcSpgzJXLY702deikeDWHHtuoWLIkMLgkli+ttAfhcTa4TzdW5BGPi/CxK/bqgI\n\
n3+8w/yxlErADPnIeoztkIi4Y+j3Q0CDKYCGIGoEoQ9whMNR1L2pdJF3j0Axmpx9\n\
t/2CryGX74nlBEr7N7Sd0ikUR3hIWxcxp61iCjyt477LYzAji4d0DUS4XGw0/DAf\n\
xCvzLa8G24p+eZyTjbv5Q8aIcz5EXJoaw6e3UWpbCyvyNRXzpUDGBx+mMO9+qv4e\n\
bxtsXR3oDLQbZm9vYmFyIDxmb29iYXJAZXhhbXBsZS5jb20+iQE+BBMBAgAoAhsj\n\
BgsJCAcDAgYVCAIJCgsEFgIDAQIeAQIXgAUCUjHaPwUJAib6OwAKCRCNGOsi/fYz\n\
ojLHB/9Xp/Gy2n0cMGp6A0UHDjqKM9BgI6CkWDagqqX9EKW72ihb7V/jV8E5knW0\n\
7xLJM7cxWqCBydvvXYgZpjpMCBEqi6OF8WEPC/oA8OA0YcllgJ6Hn4aKaS9Huxy3\n\
6dtepn8hS42ZnkdH//ZYwhOjPMzNowxqrYElD0NxW/cEYX6OTaiA9FQulkUcGGQw\n\
tCTJ55jmEL1G55VLvZnvXYjui6g+DDqukWFS0aKGpt4MyphPFh8Oo+vbtmVtqeH2\n\
p5gLWxCQ5TgfZ7oER+4pv1Da/cc+VYuRcgyIY/B+2Iyigr4UdN5CkZo6tmBS1+Pw\n\
4ACrEvbwSmJiWrSHEe1brOr3qdnXtBtibGFibGEgPGJsYWJsYUBleGFtcGxlLmNv\n\
bT6JAT4EEwECACgCGyMGCwkIBwMCBhUIAgkKCwQWAgMBAh4BAheABQJSMdo/BQkC\n\
Jvo7AAoJEI0Y6yL99jOiWzcH/3wdUIF9XL4V/Fy4otvqlcWD6CcvHq52HAmyMltg\n\
lNRd0ndoL0mO29tGnlNEu9DLTC7jukZOYOWzDyp9TOKvLzw8ZpQfOxBBsTp3xJpf\n\
MuK/sh/9KJIJnShyych/Jy7hlwXzMpIpqIyXPo5PrRhSCt4bd4AALUUWOD4WB/xm\n\
fRq6k7/I1sc8IuC5KT9gmsaEjyjuRW3GJVpb93iwYH6/ISHlKUfJYMZwPIQLUl6n\n\
NmeQW8eDcvoMh4epkPf0S2BWy0ZUCxusvKBMjJ8YwTaIiME4PXR92Bt1Hs09W/Ip\n\
BYqJZiSpMgD4nw9sTku6ivsUp17r0M3X46Xn+7NDc4UILuPR/wAAQcb/AABBwQEQ\n\
AAEBAAAAAAAAAAAAAAAA/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMD\n\
AwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8X\n\
GBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQU\n\
FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAGQAZADAREAAhEBAxEB\n\
/8QAGwABAAIDAQEAAAAAAAAAAAAAAAQFAQIDBgj/xAAaAQEAAwEBAQAAAAAAAAAA\n\
AAAAAgMEAQUG/9oADAMBAAIQAxAAAAH6VAAAAAAABgGvJa87h3DuOdAAGe8y5lzb\n\
vNu8OZAAAAAAAAAAAAAAAMGOd15LmnyjZy5PTk9XTuAZDmzm/Ydew6yr6IbdjnvM\n\
gAAAAAAAAAAAAAAwaclyjbGjdEhpjRv4Ru58nrzuHRlzbvOnYd5UyZUS55pMqesq\n\
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\n\
V4dzd5k2zJIlUAMAAAAAGQAYAAAAANed4xthQ1VFPp+fzez57P7NLR6lfXs4Ru05\n\
I7lzfsJM6LO3DeX+T6HT4t9o8e1t8+ZPN2lWMAxzow6AAAMuZHeAY50YdAAABzHO\n\
8040NFbXup6PSpqfUrKt8OvTx5brzuHcub9j3lTOsy2tvnXV/l293m2FmORKjrKG\n\
DXndeS1S15LDuAAAbOZ7zZHZF1jncJa87q7h0AAZcy5t1jjjyyJDTXV7a6rbBhrj\n\
wv58nq6Bs51lXKlnn2Y7K3DYWY5k83aVW3Y68lz5PlGzjy3lyznyWOSwADZzfsen\n\
a+sq+vYZc0S5Rny5Zz5ZrzuHQBlzbvOna+vYb9hh3jG2HDTBr1xY6OEbtOSw7gyZ\n\
c6dhIlTMnlnWZJs8smdHTteTlyfCN8OGiHDVEho4Ru05PDuAbObdj27VJnRMnmkS\n\
o37HlGyJHRFhpjxu5Rs1dw6MubOdZVyJUyp55Us/TsOXLIcNMCvXDhq4Ru58njnc\n\
GTbsenYSZUTbMlhZjn2ZJU8/XteDhG6DXrrKt1VV6NbVuhw08o26O453PWyPXsJU\n\
89hZisrcM+zH07CPG+tq21tW+DDVHjfpyWOdGe837GRKidPLZW4LG3FJlTy5Ovq2\n\
1dW+ur2xIaeXLNedO5c27HtKqbPNZ24La7zbS3BOsySO06uxYaKyvfSZ/Voc/r0t\n\
PqV1W2PG/TktXcm/Y9pUz55Le7zrq/yra7zusq4demmp9Slo9Srq3xIaefLNedG3\n\
edO1y55rS3BdX+Xc3eXMnm48sqqfRpKPVqKfSgV6+PLtOScO86djIlRY2Yrq/wAu\n\
+0ePeX+VZ24JU8+HYUNVRR6Xnc3teaze95/N7FVV6EWGjnyeHR07GRKiytw3l/k+\n\
h0+LdX+X3lTAr2UOf2PPZvZp6fTg16+MbdXRs52lVOsyXF3meh0+NfaPHn2Y+Ebq\n\
Wj1PPZvao6PWrat0eN/Pkhlzp2Eqee1t8/0Gnx/S6fB9Fp8W3u82bZlw7Br10tHq\n\
eZy+75bJ9D5vN7dRT6USGnlyzHO57zdGTPPaW4L/AEeN6XV4d9o8iRKiuq3edze1\n\
5rN7lJR60CvZwjbryQ27HvKqfZju7/J9Lp8P0WnxbG3DHjfQ5/X81l9ygz+zV1b4\n\
0NGiWOdz3nXtcuea3u830enxPVa/nvTavCur/LnWZHECGuko9by+T3/J4/ovNZvd\n\
p6PThw08uWa87nvOnYypZ7S7z/Q6fF9Pq8G/0ePJlRW1bvN5vc8zl96iz+tX17eE\n\
bdUhsj3lVYWYr3R5PptXg+k0+HZW4Y0b6DP7HmMvveeze1V0+hFjo58ljndu869r\n\
mTzXF/mel0+F6zZ876jX4F3f5M+eQV8NlHn9by+T3/J5Po/M5fdp6fThV6uXJ45L\n\
Lm8oSp57W3z/AEWnxfUavAv9HjSZ01lW7zeX3PMZffoqPWr6tvCN2nOjfvO8qbC3\n\
Fe3+T6fV4HpNXh2duGNC6gz+z5fL7/nc3tVVXoRYaNIzw7nsevYTbMtxd5nptXhe\n\
s1/Oeo1+BeaPJsJ4xXw2Uef1vL5Pf8lk+j8zl96no9OFDVzjPV3Jv2Euee1u870W\n\
jxfT6/Av9HjyZ0VtW7zWX3fM5feoc/r19e3hG3Tkhv2PeVVhZivtHkem1eD6XV4V\n\
lbhjQvoM/seYye/53P7VVT6MSGjTk8GznSUJs8txf5nptXg+t1/Oeo1+BeaPJsJ4\n\
xAhso8/reWy+/wCTx/Reay+9TU+nDr08uWY513nTsZU89rb5/odPieo1eDf6PGkz\n\
prKt3m8vueZy+9Q0evX1beEbdUhsj3lVYW4r6/yPTavB9Jq8OztwxoXUGf2fL5fe\n\
89m9uqq9CLDRz5Jzue869rmWZrm7zPS6vB9Zs+d9Tq8C80eTPnjECGuko9by+T3v\n\
KZPovNZfdp6fShw1c4z1Sy507CTOi1t870OnxvTavBv9HjyJU1tW7zmb2/M5fdo6\n\
PXrq9nGN2nOjfvO0qbGzHeX+R6bV4Xo9PiWVuGPG6gz+x5nL73ns3s1VXoxoX8+T\n\
w7sj0lCZPLcXeb6XV4Xq9fzvqNfg3d/kz55HeQq9dLR6nms3u+WyfQecze3U0+jD\n\
hp58sxzue83Rkzz2duC/0eP6TV4d7f5MiVFdXu89m9nzmb3KSj1YFezhG3XnRt3n\n\
eVU+zHd3+V6PT4fodPjWNmGPG+io9bzeX3KDP7FZVvjQ0aJY53PedO1zJ5ra7zvR\n\
6fE9Tr+f9Lp8K5v8udZly5DhpqKfS8/m9nzeb3KHP69XV6EWGjTk9Xcub9jIlRY2\n\
Yru/yvQafGubvM7ypgV7KKj16DN7FPT6UKGrjG3Doy52lVNnluLvNv8AT497f5E+\n\
zHwjdTU+n5/N7NJR6tdXtjxv05LDuXOnYSp57S3z77R5HpNPh+g0+Nb3ebMnm2Ri\n\
x0V1W6lp9Ojz+tT0+nAr2R43aclh3Jsj2lVNsy21vnXN/mWdvn9u1w4aain0qen0\n\
62rdEho58s1dGznTtcueeytw3F3mW93mzJ5uPLKyr0Kaj06mr0YVerjG3VLBlzfs\n\
ZEqZ9mO4u8y80eVdXeXY24ZUs+e84xthw011W6sr3V9W2LHRyjZqljh1s507CTLP\n\
OsyWNuKbPL07CPG6BXsrq9sOvVwjboljnRnvN0e8qplmWxsxT7MciVPPk4UNVdVt\n\
g1640dHPk9XXGetkesq5Us9hbjs7MFjbhmTzdpVbOc+T4xtixviw0xY38o26JY53\n\
ANu82R69rkSpkzokSp2R5csjxuixv4xu58nrzuHRlzbvOnYdpUypUSJU9e16pR43\n\
RoXx43cuWapa86Mme83R6yqlSolTzSpUdpVdOwz3mOd58nz5PlyznyevJau4dAyZ\n\
c2R6dh0lDp2GXNOS05PlyenJ6uncAyHNnN+w69hv2G/Y4d58nzjPnyeqWHcAGXNn\n\
Nux6dh17X07Dp2Ge8yYMc7q7jktXcOuAABnvMubOZ7w4d153DuHcc6AAM95lzLm3\n\
eHDuOd1dw7jnQAA6y5s5nsdnM95k/8QAIhABAAICAwEBAQEBAQEAAAAAAAIDAQQR\n\
EhMUQCAQUDEw/9oACAEBAAEFAvxcuXLl2dnZ2dnZy5cuf+JyzlmTu7vR6PR6PR6O\n\
7uxJjLn/AIWWcpSSsStZue73e73e73YuRtRsRkxlj/g5SynNZanelsM7L6X0vpfS\n\
xso7CF6u1CaOWP8AgZSWZWzXWrbk9hnYfS+l9L6WNhDYVXKbVU1eUWP35TW5XyXz\n\
XWrLmbns9ns9mLldym1RNRJVlBj9+U1zYy2JL5LJpTd3d3d0Zq5qJNeTXypQY/fl\n\
Nc2GzlflZlLLly5co5V5UZazXUoMfvymubLZXrEv5irUNZrKUGP35TXNlsr1qX8x\n\
VKGs1lKDH78prmy2V6xL+Yq1DWaylBj9+U1zYbK/CzCWHDhw4RwrwoazXUoMfvym\n\
ubGGxhfFZFKDo6OjojBXFRFr4a+FKDH78prcL4tiC6tZUlU8Xi8XijUrqU1teCiK\n\
rCDH78pLMLoLq1tKdDOu+d8753zsa6FCqlTWpgrwix/wMp4WQWVJ0Ja7Os+Z8z5n\n\
zMayOuhQrqVwQwx/nLly5cuXLly5c/lyzhKCVaVLNDwfO+d8753gxQjSjWjFjH+c\n\
uzu7u7u7u7u7uzs5c/lzhmDNbzeTyeTyeTyebFbEXH+ZyzNmxm17PZ7PZ7PZ7MWs\n\
WMSYyx+Thw6urq6urq6urq6uP8ylJOxO5K9nYfQ+h9L6H0MbCN6FqE0ZMZY/Nw4c\n\
OHDhw4/3KWVkltiy5PYZ2X0vpfS+ljZR2EL1VyqxXJHLH78srMrpL5rrVlyV7N76\n\
Hu92L0L1Vym1RNVJDLH78pLF+WxJfNbYnYzY9Ho9GLELFNjXm15Kcq2P35SWr2zl\n\
sZWyTkzJ2dnZiSElMmvlrZUK2P35SWthsthcmz/GEFLWayhWj+/KS1sNlsLk2f4w\n\
gpazWUK0f35SWthsthcmz/GEFLWayhWj+/KS1sNlsLk2f4wgpazWUK0f35SWr2zh\n\
sYWxTizF1dXViKEVMWvhrYUK2P35SWL8NiK+C2tOtmt5vN5sVoVqa2vBrxU4Vsfv\n\
yyswuivguqWUpUM0PB4PBihChVSorUQVRQY/rly5cuXLly5/+HLly5cuXLn/AHKW\n\
FkVta2lOhnXfO+d8752NdGhClVUqgrijhj+OXLs7Ozs7Ozs7Ozly5cuXLs7Ozs7O\n\
zs7Ozs5/ySeE4J1pVM0vF4vF4vFilGpCtCKGGGP9zlmTM3o9Hq9Xq9Xq9HoxNiTl\n\
y7MzZsej1er1er1er0YsYk7f5JJJLDOHDhw4cMYRwggiwx/mUpJTStSuZvfQ+h9D\n\
6H0MXsXI2o2MSdmZpWJXM3vd9D6H0Poe7F6NyNjE3ZKSck5pWM2PR6PR6PRixGaE\n\
0JI5YYZSynJZYsuTvZ2X0vpfS+l9LGyjsK7kLUZu6diy1O9LYZ2X0vpfS+ljZR2E\n\
L1dqE3ZKayxZancze+h9D6H0PoYvQuV2q5oSRywynlbJdNdasvS2Gdh9D6H0MbCO\n\
wrvVXKrEJuyya61bcnezsPofQ+h9DGwhequU2q5uyc1ti21Zele+h9D6H0MbCN6u\n\
5TapmqkhlhlNdlsSXzW2J2s3PZ7PZi5G1VaosUTVyZktkvmusWWpWvZ7PZ7I2q7V\n\
NiiaqTElkl819i21K1m57PZ7MXIWqrFE2vJTlBhlYvbOWxJdJObM3d3d2JoTVSUS\n\
UZV5Zyuy2Mr5LJJTd3d3d0Zq5KJNfKnLGVmV+V8lsk5szd3d3YmhNTJrya2VCthJ\n\
YvbLZXZTyzly5csZQyqy12urZXNhesylly5cuUcq8qGupYWNhsLcp5Zy5cuWMoZU\n\
5azWUK0Uli9stlemz/GEFLXa6tlc2F6xL+Yq1DXUsLGw2FybP8YQUNZrKFaKSxe2\n\
WyuWM/xhBS12urZ/8ubC9al/MVShrqWP/LGw2FybP8YVqWs1lCtFJYvbLZXJs/xh\n\
BS12urZXNhesS/mKtQ11LCxsNhcmz/GEFLWayhWiksXtls4XYTwzhw4cMYQwqw18\n\
NdWyubGF+FmEsOHDhwjhXhRhr4UsLGw2MLcJ4Zw4cOGMIYU4a2GsoVosrF2GxhsR\n\
XQTgzB0eboxBCCqCiKjCvDOF2GxFfFZBKDo6OjojBXBRFrxU4YwswvwvitgnBmDo\n\
83RiCEFMGvFr4U4VsMprsL4L61tSdLNLxeLwYpRpV1Ka1MEIsxWxX1rqk6WaXi8X\n\
i8WKUKVNSitVFiKcV0F1aypKlml4vF4MUoUqqlFaiCnCDDKeFkV1a2pZQlrs675n\n\
zPmY1kddChVSqrQg6LILallKeuzrvmfM+Z8zGuhrq6VVSuDonBbWtpToS12dZ8z5\n\
nzMa6OuroVVKa1cUMMMs4TisrWUp0M675nzPmfM+ZjWR10KUK0YOiUE6k6EtdnWf\n\
M+Z8z5mNZHXQoQqRg6JQTrTpS12dZ8z5nzPmfMxroUK6VdaEWMMf5lKKUEq2aWaH\n\
g8Hg8Hg8GKUakYMRdWYJVpVM0vB4PB4PB4MUo1I1sQdWYpQSqZpeDweDweDwYoYp\n\
RrRgjFj+OGcMxdHm83m83m83m6MQdXDhwzF0dHm83m83m83R0Yi4cOHVmDo83m83\n\
m83m83RiLGHH9cOHDq6urq6urq4cOHDhw4cOHV1dXV1dXDhw4cOHDhw6urq6urq6\n\
uHDj+P/EAB4RAQADAQEBAAMBAAAAAAAAAAABAgMTEhEgQFAQ/9oACAEDAQE/Af0/\n\
j4+Pjy8vLy+Pj4+fxviKvLw8PDw8PDw8PKavn8SIRVWiM0ZOTi4uLi5JyTmtRNUx\n\
/ChWFKqZq5IxcHBwcHBwTitkvmvVaE/wYUhnVnmzyVxRg4ODg4JwWxaZNM2lV4T/\n\
AAIVZwyqxoyzUzRk5OTk5JyXza5tqNatIWT+/CrNjDCGVVKoq8PDw8JqvVrVvDaG\n\
iyf34VZMGDGFIVh8fHx8WheG0N27VZP78KsmDBizV/GzRs3btVk/vwqyYMGLNX8b\n\
NGzdu1WT+/CrJgwYs1fxs0bN27VZP78KsmDBjLNWX19fX1aWjZu3arJ/fhVmxlhL\n\
KVLIs9PT09JsvZrLeW0tFk/vwqzljLGzK6miNHR0dHROi+jW7azaWkrJ/gVUlnZl\n\
dnqrsjZ2dnZ2Tsts01a3a2XlP8GFZUspopqjZG7u7u7undOy+q+i9lpT/nx8fHx8\n\
fHx8fHx8/WiVbK3RojV2dnZ2dnZOqdFrrWT/AJ8fHl5eXl5eXl5eXx8/V+olFkXe\n\
3R0dHR0dHtN02ff8+IqiiM3NycnJycnNOaaJqmP1vr69PT09PT09PT6+/wCQrVWi\n\
uSMUYuDg4ODgnFbJbNai0Jj+DCsKVZ0Z5K4owcHBwcHBOC+LTNpReq0J/gQpDOGV\n\
GWamSuTi4uLinFbJpk1za1aQsn+BVRlDGrGrOitEZubm5potRpRtVtDWF0/wKs2L\n\
CGMM4Vqiry8vKar1aw3hvDVdP8CrNiwYs1UfhK7Vu3arrfwKs2LBizVR+ErtW7dq\n\
ut/AqzYsGLNVH4Su1bt2q638CrNiwYs1UfhK7Vu3arrfwKs2LCWMs5Vsiz09PSbL\n\
2ay3lvLVdP8AAqoyljZjZndW6NHR0dE3Wu0u2s2lrK6f4EKMpZXZaKaq6uzs7Oyd\n\
VtWmjW7WzSVk/wACFZUszuz0V1Rs7Ozs7Oydl9WmjS68rJ/D4+Pjy8vLy8vLy+Pj\n\
5/vx8fHl5eXl5eXl5fHz/IVlSyt1dEaOrq6urqnRbRe69lpT+EQiqKoo5ubm5ubm\n\
5vCaJq+Pj4iqKPDm5ubm5ubwmjy+f5VVVCJfX19fX1KVlkp/2IRCtVc0ZIxcXFxc\n\
XFxTktmtRNXlFVaIyRk4uLi4uLinJOa1E1fEQrVWqKIo8PDw8PCaLUWqtC0J/wAh\n\
EKQpRTJXFGDg4ODg4JwWxXyXomryrRTNTJGKMHBwcHBOCcV8l81qPKtVKKZq5Ixc\n\
XFxcXFOK2S+a9V4WShVnDKjLNTJXFGLi4OLinFfJpm0otV5UqzzZ5K4oxcXFxcU4\n\
rYtMmma9XlWrOjPNTJXFxcXFxTitivk1za0aQslCjKGNWNGdFc0Zubm5pzWzaZta\n\
Narw+M6sqsqKZozc3Nzc05r5taNatKvikMqsqM81c0Zubm5pzWzaUbUbVawulCjJ\n\
hDGGVVKoq8vLymq1WlW0NoXhDOGMMoUqiry8vLymq9WsNoaQlSGMMYZ1Vqiry8vK\n\
ar1a1bQ3hqulCjFgwZKQiHx8fEwtDSGzZdDJixZwrD4+Pj4tDSGzZqlRixZwrCIf\n\
Hx8TC8NW7dsulVRkwYMlEfhKzRs2XQyYsWav42aNmzVKjFizVR+ErtW7dqusqoxY\n\
MGSiPwlZo2bLoZMWLNX8bNGzZqlRixZqo/CV2rdu2XWVUZMGDJRH4Ss0bNl0MmLF\n\
mr+NmjZs1SoxYs1UfhK7Vu3arrIUZMGEspUlEvr6+plaWktpbLoZMZYypKsvr6+v\n\
q0ry2ltLVKjFjLOVZRL6+vqZXlrLeW7VdKFGTCWNmVlbIs9vb2m61mlm1m0ryiWc\n\
sZZWUsiz29vb2my9mtm0tJTKksZY2Z2Vsi729vabr2a2bWby1XShRnLGzG7PRXVG\n\
rq6urqtqvo1u1svZ9Z2ZXZaKaI1dXV1dU6r6NdGt2ln1SzKzK6miurq6urqnVbVp\n\
o2u2s0ldKFZUlndnopsrsjd3d3d3Tsvs01aXWs9KXZ6Kaq7I3d3d3d07rbL6tNF7\n\
vStmd2eqmyNnd3d3dO62y+rTRpdeVpT/AJEq2Uuporsjd3d3d3d07rbL6rXTZ6Vu\n\
porqjZ3d3d3d3dOy2q+i13pFlbqaq7I3d3d3d3dO62y+i91rJn/YRKLIujR1dXV2\n\
dXZ1TqnRN02fUWRdGiNXV2dnZ2dU6p0TdNn1FkXRojV1dnV2dXV1Tom6bJlP4fUS\n\
iz29vb29vb29vb0mX19fXp6e3t7e3t7e3t6en19fUS9Pb29vb29vb29psmX38/r6\n\
+vT09PT0+vr6+/h9fX19enp6en19fX38Pr6+vr09PT09Pr6+/j//xAAeEQEBAAMB\n\
AQEBAQEAAAAAAAAAAQIREhAgUDBAYP/aAAgBAgEBPwH/AIbbbbbbbbbbf5G223Tp\n\
06dOm22/xrVq5OnTp06dOnSZJUv4lWrVyXJ06dOnTpMkySpU/DrJlVq1t06dOm0q\n\
VjWKfhVWTJlVrbbbbbaVixYon4NVkyZL9xixYon4NVkyZL9xixYon4NZMmTJV+Yj\n\
FixYp+DWTJkyVfmIxYsWKfg1WTJkv3GLFiifg1WTJkvmvdeRixYon4VZMosWNNNN\n\
NNJEjGMU/DqxYsXFy5cuXLlMUiRIn4dWLFxcuXLly5cuUxSJE/E0005cuXLly5ct\n\
Nfe222222/8AVpppppppppppr4222226dOm222/x7Vrp06dOnTp06SpfxatWrk6d\n\
OnTp06TJKlT8Oqyq1cnTp06dOnSVjWNRPwqyZMqtbbbbbbSpWNYon4VZMmSr9RGL\n\
Fin4VZMmSr9RixYsU/CrJkyVfqMWLFin4VZMmSr9RixYsU/CrJkyVfqMWLFin4VZ\n\
MmSr9RGLFin4VZMmUWNNNNNNJEjGMUT8KqyixY5cuXLly5SMYxiJ+HVixcXLly5c\n\
uXKYpEifiVYsaaaaaaaaaSIn3ttttttttttv52222222222238Vf5T+G223Tp06d\n\
OnTpttvzbbbp06dOnTp02237VrbbbbbbbbaVPqrVq5OnTp06dOkyTJK22tWrk6dO\n\
nTp06dJklSttrVq5OnTp06dOkqVKnxVWrVydOnTp06dJklSpfLVq1cnTp06dOkyS\n\
pUvlq1auTp06dOnTpMkqVE9qsmVWrW222220rGsanlZVatbbbbbbSpWNTysqyq1t\n\
tttttKlY1iie1kyZKvm/N+xixTysmS+b935GLFPKyZL5tvzfkRixYp7WTJkq/URi\n\
xTysmS/cYsU8rJkq/URixYp7WTJkyX6iMWKeVkyVfmIxYp5WTJV+oxYsWKe1kyZM\n\
l+ojFinlZMlX5iMWKeVkyVfqMWLFintZMmTJfqIxYp5WTJfuMWKeVkyVfqMWLFin\n\
tZMmSr9RGLFPKyZL9xixTysmSr9RGLFintZMmSxY000000kYsU8rJksaaaaaaSMW\n\
KeVkyWNNNNNNJEjFixT2qyZRYsacuXLTSRjEieWMosWNOXLly0kSMYk8qxlFjTTl\n\
y5aSJGMYontVYsXFy5cuXLlymKRIk8sWLiuLly5cuXKYpikSeWLFi4uXLly5cuUx\n\
SJET4qxYuLly5cuXLlykSNeaWLi5cuXLly5cpika80sWOXLly5cuXLlIkT60005c\n\
uXLly5aaa900005cuXLly00017pppy5cuXLly001/HTTTTTTTTTX1pppppppppr6\n\
0000000001+x/8QAFBABAAAAAAAAAAAAAAAAAAAAsP/aAAgBAQAGPwIcT//EACEQ\n\
AAEEAwEBAQEBAQAAAAAAAAABETFhEEFxISBQQDBR/9oACAEBAAE/If4l/wBTAyfi\n\
FyVQv3AQpkqfhFDYyMFpaLY6Ozs6EsWlo4Oj4r+9RRWNoY2MbLSw7Ozs7LC0c2Ob\n\
HsahBP7yhkacYcZf0sLxbHR0JYvLB1vRxh4dFfgisDLjbkhYXi3OzsS5eWEA+w62\n\
BX4QVJITEp7LhXPTF9kISIgFR+GMFFySEx7YVz0xfYiFQLggn4c7Gxubi/RQqjji\n\
KKF+mpqaGn4U3NzY3JqbYqKIJjoTQ1NDU1/CO5sbm5NSYuUJkzU1NDT8OYKbiZJs\n\
wuQmRJgTBqQT8OkSTE5Ke64FyEwPdCAjIhEfhJBITEhP4UYVocHAlMNBH4QEREI/\n\
BE43HH3H38KSsWotTkSpWUjbeDbDDYUf3lFEjo4PD2isoOTk5OSgrGtDYwMiR/8A\n\
QAD/AMiB8eHxzRQLU4ODg4EqUDGhsZxRioXB38fvBCgQJ/GVBU+EFxcHBwcYJmKN\n\
IwtYrRbHR2dnR0JYsxPj4r+Nhf8AVf4qCxoYGNjOywW52dCXEuWDmx0dHsSv5W/x\n\
AGFTKbGRvZYXC3FudnZYWj+xzY4w5iV/Kwwwwwwww3yjDjLjTnvJcWi2OzstLCwe\n\
Ycb8GC5FkhMTYLcvsQ3l5AQEREK/vrhHBckhOTfI6Z9ERkAqPwNfhbG4uRXqihQ4\n\
4iixYv0VAqDXGH9y5YKbG4uTb4HEz6mhrjAh/cuWCmxuJk2+BhM+poa4wIf3L8LY\n\
3EyI9UQIGGEQSJE+iIEQa4w/uXCOCZJCcm+R0z6IjIBEfga5EkhMTYKcvkQ1lZAQ\n\
EREI+rjjjjjjjjjj/Tjjjjjjjj/KOOOuTFZUUnJyJUoKCgZYYYiEfR/8gA/y4/8A\n\
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\n\
GKZevFwp236pebE=\n\
=gyL8\n\
-----END PGP PUBLIC KEY BLOCK-----';
testKey.privateBlock = '-----BEGIN PGP PRIVATE KEY BLOCK-----\n\
Version: GnuPG v1.4.13 (GNU/Linux)\n\
\n\
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\n\
=EZ0k\n\
-----END PGP PRIVATE KEY BLOCK-----';
