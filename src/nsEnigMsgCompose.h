/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License
 * Version 1.1 (the "MPL"); you may not use this file except in
 * compliance with the MPL. You may obtain a copy of the MPL at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the MPL is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the MPL
 * for the specific language governing rights and limitations under the
 * MPL.
 *
 * The Original Code is Enigmail.
 *
 * The Initial Developer of the Original Code is
 * Ramalingam Saravanan <sarava@sarava.net>
 * Portions created by the Initial Developer are Copyright (C) 2002
 * the Initial Developer. All Rights Reserved.
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
 *
 * ***** END LICENSE BLOCK ***** */

#ifndef _nsEnigMsgCompose_h_
#define _nsEnigMsgCompose_h_

#include "nsCOMPtr.h"
#include "nsIFactory.h"
#include "nsIMsgComposeSecure.h"
#include "nsIStreamListener.h"
#include "nsIPipeTransport.h"
#include "nsIEnigMimeListener.h"
#include "nsIIPCBuffer.h"
#include "nsIEnigmail.h"

#define NS_ENIGMSGCOMPOSE_CLASSNAME "Enigmail Msg Compose"

#define NS_ENIGMSGCOMPOSE_CONTRACTID "@mozilla.org/enigmail/composesecure;1"

#define NS_ENIGMSGCOMPOSE_CID                    \
{ /* 847b3a21-7ab1-11d4-8f02-006008948af5 */     \
   0x847b3a21, 0x7ab1, 0x11d4,                   \
{0x8f, 0x02, 0x00, 0x60, 0x08, 0x94, 0x8a, 0xf5} }

class nsEnigMsgCompose : public nsIMsgComposeSecure,
                         public nsIStreamListener
{
public:
    NS_DECL_ISUPPORTS
    NS_DECL_NSIMSGCOMPOSESECURE
    NS_DECL_NSIREQUESTOBSERVER
    NS_DECL_NSISTREAMLISTENER

    nsEnigMsgCompose();
    virtual ~nsEnigMsgCompose();

    // Define a Create method to be used with a factory:
    static NS_METHOD
    Create(nsISupports *aOuter, REFNSIID aIID, void **aResult);

protected:
    static const char* EncryptionHeaders;

    nsresult Finalize();
    nsresult FinishAux(PRBool aAbort, nsIMsgSendReport* sendReport);

    PRBool                        mInitialized;
    PRBool                        mUseSMIME;
    PRBool                        mIsDraft;
    PRBool                        mRequestStopped;

    PRUint32                      mInputLen;
    PRUint32                      mOutputLen;

    PRUint32                      mSendFlags;
    PRUint32                      mUIFlags;

    nsCString                     mSenderEmailAddr;
    nsCString                     mRecipients;

    nsOutputFileStream*           mStream;

    nsCOMPtr<nsIMsgComposeSecure> mMsgComposeSecure;
    nsCOMPtr<nsIEnigMimeListener> mMimeListener;

    nsCOMPtr<nsIIPCBuffer>        mOutBuffer;
    nsCOMPtr<nsIPipeTransport>    mPipeTrans;
    nsCOMPtr<nsIStreamListener>   mPipeTransListener;
};

#define NS_ENIGMSGCOMPOSEFACTORY_CLASSNAME "Enigmail Msg Compose Factory"

#define NS_ENIGMSGCOMPOSEFACTORY_CONTRACTID "@mozilla.org/enigmail/composesecure-factory;1"

#define NS_ENIGMSGCOMPOSEFACTORY_CID             \
{ /* 847b3a22-7ab1-11d4-8f02-006008948af5 */     \
   0x847b3a22, 0x7ab1, 0x11d4,                   \
{0x8f, 0x02, 0x00, 0x60, 0x08, 0x94, 0x8a, 0xf5} }

class nsEnigMsgComposeFactory : public nsIFactory {
public:
  NS_DECL_ISUPPORTS
  NS_DECL_NSIFACTORY

  nsEnigMsgComposeFactory();
  virtual ~nsEnigMsgComposeFactory();
};

#endif