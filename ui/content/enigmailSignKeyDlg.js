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
 * The Initial Developer of the Original Code is Patrick Brunschwig.
 * Portions created by Patrick Brunschwig <patrick@mozilla-enigmail.org> are
 * Copyright (C) 2004 Patrick Brunschwig. All Rights Reserved.
 *
 * Contributor(s):
 *   Nils Maier <MaierMan@web.de>
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

Components.utils.import("resource://enigmail/enigmailCommon.jsm");
Components.utils.import("resource://enigmail/keyManagement.jsm");
Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource://gre/modules/NetUtil.jsm"); // TODO: Check if needed
Components.utils.import("resource:///modules/gloda/mimemsg.js"); // TODO: Check if needed
const Ec = EnigmailCommon;


var gSignatureList = null;
function onLoad() {
  window.arguments[1].refresh = false;

  var enigmailSvc = Ec.getService(window);
  if (!enigmailSvc) {
    Ec.alert(window, Ec.getString("accessError"));
    window.close();
    return;
  }
  var keys = Ec.getSecretKeys(window);
  if (! keys) window.close();
  var menulist=document.getElementById("signWithKey");

  for each (key in keys) {
    menulist.appendItem(key.name + " - 0x"+key.id.substr(-8,8), key.id);
  }
  if (menulist.selectedIndex == -1) {
    menulist.selectedIndex = 0;
  }

  // determine keys that have already signed the key
  try {
    var exitCodeObj = new Object();
    var errorMsgObj = new Object();
    gSignatureList = new Array();
    var fingerprint = "";
    var sigListStr = enigmailSvc.getKeySig("0x"+window.arguments[0].keyId, exitCodeObj, errorMsgObj);
    if (exitCodeObj.value == 0) {
      var sigList = sigListStr.split(/[\n\r]+/);
      var currKey = null;
      for (i=0; i < sigList.length; i++) {
        var aLine=sigList[i].split(/:/);
        switch (aLine[0]) {
        case "uid":
          if (typeof(currKey) != "string") currKey = aLine[4];
          break;
        case "sig":
          gSignatureList[aLine[4]] = 1;
          break;
        case "fpr":
          Ec.DEBUG_LOG("fpr:"+currKey+" -> "+aLine[9]+"\n");
          fingerprint = aLine[9];
          break;
        }
      }
    }
    enigKeySelCb();
  } catch (ex) {}

  var keyDesc = window.arguments[0].userId+" - 0x"+ window.arguments[0].keyId.substr(-8,8);
  document.getElementById("keyId").value=keyDesc;
  if (fingerprint) {
    var fpr = fingerprint.match(/(....)(....)(....)(....)(....)(....)(....)(....)(....)?(....)?/);
    if (fpr && fpr.length > 2) {
      fpr.shift();
      document.getElementById("fingerprint").value=fpr.join(" ");
    }
  }
  var sendSignedPubkey = EnigGetPref("sendSignedPubkey");
  Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onLoad: Setting saved sendSignedPubkey state: " + sendSignedPubkey + "\n");
  if (sendSignedPubkey != null) {
    document.getElementById("mailSig").checked = sendSignedPubkey;
  }
  else {
    document.getElementById("mailSig").checked = true;
  }
}

function onAccept() {
  var trustLevel = document.getElementById("trustLevel");
  var localSig = document.getElementById("localSig");
  var signWithKey = document.getElementById("signWithKey");
  var keyId = window.arguments[0].keyId;

  var enigmailSvc = Ec.getService(window);
  if (!enigmailSvc) {
    Ec.alert(window, Ec.getString("accessError"));
    return true;
  }

  EnigmailKeyMgmt.signKey(window,
    "0x"+signWithKey.selectedItem.value,
    window.arguments[0].keyId,
    localSig.checked,
    trustLevel.selectedItem.value,
    function (exitCode, errorMsg) {
      if (exitCode != 0) {
        Ec.alert(window, Ec.getString("signKeyFailed")+"\n\n"+errorMsg);
        return true;
      }
      else {
        Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Saving sendSignedPubkey state: " + document.getElementById("mailSig").checked == true + "\n");
        if (document.getElementById("mailSig").checked) {
          EnigSetPref("sendSignedPubkey", true);
          var exitCodeObj = new Object();
          var statusFlagsObj = new Object();
          var errorMsgObj = new Object();
          var keyId = window.arguments[0].keyId;

          var enigmailSvc = Ec.getService(window);
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Preparing Message\n");
          let fields = Components.classes["@mozilla.org/messengercompose/composefields;1"]
                       .createInstance(Components.interfaces.nsIMsgCompFields);
          let params = Components.classes["@mozilla.org/messengercompose/composeparams;1"]
                       .createInstance(Components.interfaces.nsIMsgComposeParams);
          // TODO: Set Mail to automatically be encrypted (and signed?)
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Retrieving Key Data for " + keyId + ": enigmailSvc\n");
          var sigListStr = enigmailSvc.getKeySig("0x"+keyId, exitCodeObj, errorMsgObj); // Retriebe Key Data
          if (exitCodeObj.value == 0) { // If key data retrieval worked...
            Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Retrieving Key Data: EnigGetKeyDetails\n");
            var keyDetails = EnigGetKeyDetails(sigListStr); // ...parse the key data into a format we can use
            if (keyDetails.gUserId == "") { // Check if a UserId was found, abort if it was not
              Ec.alert(window, "No user ID found for the Key you have signed. Unable to create Mail.");
              return true;
            }
          }
          else {
            Ec.alert(window, Ec.getString("An error occured while querying the Key Data")); // TODO: Add this in localization files
            return true;
          }
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Setting up Fields for eMail\n");
          // Set up mail data
          fields.to = keyDetails.gUserId;
          fields.subject = "Your signed PGP Key with the ID 0x" + keyId;
          fields.body = "Please find attached your signed PGP key with the ID 0x" + keyId + ".\n";
          fields.otherRandomHeaders += "x-enigmail-draft-status: "+ Components.interfaces.nsIEnigmail.SEND_ENCRYPTED +"\r\n";
          params.type = Components.interfaces.nsIMsgCompType.New;

          /**
           * Attach Pubkey
           * Copied and slightly modified from enigmailMsgComposeOverlay.js, function extractAndAttachkey
           */
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Creating Tempfile \n");
          var tmpDir=Ec.getTempDir();
          try {
            var tmpFile = Components.classes[Ec.LOCAL_FILE_CONTRACTID].createInstance(Ec.getLocalFileApi());
            tmpFile.initWithPath(tmpDir);
            if (!(tmpFile.isDirectory() && tmpFile.isWritable())) {
              Ec.alert(window, Ec.getString("noTempDir"));
              return null;
            }
          }
          catch (ex) {
            Ec.writeException("enigmailSignKeyDlg.js: onAccept: ", ex);
          }
          tmpFile.append("key.asc");
          tmpFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0600);
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Extracting Key \n");
          // save file

          enigmailSvc.extractKey(window, 0, keyId, tmpFile /*.path */, exitCodeObj, errorMsgObj);
          if (exitCodeObj.value != 0) {
            Ec.alert(window, errorMsgObj.value);
            return  null;
          }

          // create attachment
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Create Attachment \n");
          var ioServ = Components.classes[Ec.IOSERVICE_CONTRACTID].getService(Components.interfaces.nsIIOService);
          var tmpFileURI = ioServ.newFileURI(tmpFile);
          var keyAttachment = Components.classes["@mozilla.org/messengercompose/attachment;1"].createInstance(Components.interfaces.nsIMsgAttachment);
          keyAttachment.url = tmpFileURI.spec;
          keyAttachment.name = "0x"+keyId+".asc";
          keyAttachment.temporary = true;
          keyAttachment.contentType = "application/pgp-keys";

          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Attach Attachment to Mail \n");
          // add attachment to msg
          fields.addAttachment(keyAttachment);
          gContentChanged = true;
          /**
           * End Attachment code
           */
          // Set Mail format to plain text, for compatibility
          params.format = Components.interfaces.nsIMsgCompFormat.PlainText;
          params.composeFields = fields;
          // Spawn message window
          MailServices.compose.OpenComposeWindowWithParams(null, params);
        }
        else {
          Ec.DEBUG_LOG("enigmailSignKeyDlg.js: onAccept: Not sending signed Pubkey, saving choice." + "\n");
          EnigSetPref("sendSignedPubkey", false);
        }
        window.arguments[1].refresh = true;
      }
      window.close();
    }
  );
  return false; // wait with closing until subprocess terminated
}

function enigKeySelCb() {
  var signWithKey = document.getElementById("signWithKey");
  var alreadySigned = document.getElementById("alreadySigned");
  var acceptButton = document.getElementById("enigmailSignKeyDlg").getButton("accept");
  if (gSignatureList[signWithKey.selectedItem.value]) {
    alreadySigned.setAttribute("value", Ec.getString("alreadySigned.label", "0x"+ window.arguments[0].keyId.substr(-8,8)));
    alreadySigned.removeAttribute("collapsed");
    acceptButton.disabled = true;
  }
  else {
    alreadySigned.setAttribute("collapsed", "true");
    acceptButton.disabled = false;
  }
}

