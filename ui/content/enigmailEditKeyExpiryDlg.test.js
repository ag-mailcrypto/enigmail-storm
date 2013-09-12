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
                      
var description = "Testcase for Enigmail's Key Expiration Dialog";
var parallel = false;

function setUp() {
  /**
   * This function is always processed before each test.
   */
}

function tearDown() {
  // This function is always processed after each test.
  // (ex. destroying instances, etc.)
  
}

/**
 * This function is processed only once before tests.
 */
function startUp() {
   openKeyManagerDlg();
   openExpiryDlgWithTestKey();
}

/**
 * This function is processed only once after all tests finish.
 */
function shutDown() { 
  getEditKeyExpiryDialog().close();
  yield 100; // Wait for the close-action to comlete.
  keyManagerDialog.close();
}

var testKeyId = "FDF633A2";
var keyManagerDialog;
var editKeyExpiryDialog;
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
  action.inputTo(keyFilterInput, testKeyId);

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

  assert.equals(testKeyId, fetchedKey.id.substring(8));
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

