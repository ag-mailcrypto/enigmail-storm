#include "mimecth.h"
#include "mimemoz2.h"
#include "mimeenig.h"
#include "nsCRT.h"
#include "nspr.h"
#include "nsCOMPtr.h"
#include "nsIURI.h"
#include "nsIMsgMailNewsUrl.h"
#include "nsIMsgWindow.h"
#include "nsIEnigMimeDecrypt.h"

/* Set superclass to NULL and initialize by hand later */
MimeDefClass(MimeEncryptedEnig, MimeEncryptedEnigClass,
             mimeEncryptedEnigClass, NULL);

static void *MimeEnig_init(MimeObject *,
                           int (*output_fn) (const char *, PRInt32, void *),
                           void *);
static int MimeEnig_write (const char *, PRInt32, void *);
static int MimeEnig_eof (void *, PRBool);
static char* MimeEnig_generate (void *);
static void MimeEnig_free (void *);

// TEMPORARY; MOVE TO CLASS LATER
nsCOMPtr<nsIEnigMimeDecrypt> mMimeDecrypt;

static int
MimeEncryptedEnigClassInitialize(MimeEncryptedEnigClass *clazz)
{
  MimeObjectClass    *oclass = (MimeObjectClass *)    clazz;
  MimeEncryptedClass *eclass = (MimeEncryptedClass *) clazz;

  PR_ASSERT(!oclass->class_initialized);

  eclass->crypto_init          = MimeEnig_init;
  eclass->crypto_write         = MimeEnig_write;
  eclass->crypto_eof           = MimeEnig_eof;
  eclass->crypto_generate_html = MimeEnig_generate;
  eclass->crypto_free          = MimeEnig_free;

  return 0;
}


typedef struct MimeEnigData
{
  int (*output_fn) (const char *buf, PRInt32 buf_size, void *output_closure);
  void *output_closure;
  MimeObject *self;
  
  nsCOMPtr<nsIEnigMimeDecrypt> mimeDecrypt;

  MimeEnigData()
    :output_fn(nsnull),
     output_closure(nsnull)
  {
  }
  
  ~MimeEnigData()
  {
    mimeDecrypt = nsnull;
  }
} MimeEnigData;


static void*
MimeEnig_init(MimeObject *obj,
              int (*output_fn) (const char *buf, PRInt32 buf_size,
                                void *output_closure),
              void *output_closure)
{
  MimeEnigData *data;
  MimeDisplayOptions *opts;

  fprintf(stderr, "MimeEnig_init:\n");

  if (!(obj && obj->options && output_fn)) return NULL;

  opts = obj->options;

  data = new MimeEnigData;
  if (!data)
    return NULL;

  data->self = obj;
  data->output_fn = output_fn;
  data->output_closure = output_closure;

  // Enigmail stuff
  nsresult rv;
  data->mimeDecrypt = do_CreateInstance(NS_ENIGMIMEDECRYPT_CONTRACTID, &rv);
  if (NS_FAILED(rv))
    return NULL;

  rv = data->mimeDecrypt->Init(PR_FALSE, PR_FALSE,
                               output_fn, output_closure);
  if (NS_FAILED(rv))
    return NULL;

  return data;
}


static int
MimeEnig_write(const char *buf, PRInt32 buf_size, void *output_closure)
{
  MimeEnigData *data = (MimeEnigData *) output_closure;

  if (!data || !data->output_fn)
    return -1;

  //nsCAutoString temStr(buf, buf_size);
  //fprintf(stderr, "MimeEnig_write:: aBuf='%s'\n", temStr.get());

  // Enigmail stuff
  if (!data->mimeDecrypt)
    return -1;

  nsresult rv;
  rv = data->mimeDecrypt->Write(buf, buf_size);
  if (NS_FAILED(rv))
    return -1;

  return 0;
}

static int
MimeEnig_eof(void* output_closure, PRBool abort_p)
{
  MimeEnigData *data = (MimeEnigData *) output_closure;

  fprintf(stderr, "MimeEnig_eof:\n");

  if (!data || !data->output_fn) {
    return -1;
  }

  if (0) {
    // TEST OUTPUT
    const char content[] = "content-type: multipart/mixed; boundary=\"ABCD\"\r\n\r\nmultipart\r\n--ABCD\r\ncontent-type: text/html \r\n\r\n<html><body><b>TEST CONTENT1<b></body></html>\r\n\r\n--ABCD\r\ncontent-type: text/plain\r\ncontent-disposition: attachment; filename=\"abcd.txt\"\r\n\r\nFILE CONTENTS\r\n--ABCD--\r\n";

    PR_SetError(0,0);
    int status = data->output_fn(content, nsCRT::strlen(content),
                                 data->output_closure);
    if (status < 0) {
      PR_SetError(status, 0);
      data->output_fn = 0;
      return -1;
    }

    return 0;
  }

  // Enigmail stuff
  if (!data->mimeDecrypt)
    return -1;

  mime_stream_data *msd = (mime_stream_data *) (data->self->options->stream_closure);

  nsCOMPtr<nsIMsgWindow> msgWindow;
  if (msd && msd->channel) {
    nsIChannel *channel = msd->channel;

    nsCOMPtr<nsIURI> uri;
    if (channel)
      channel->GetURI(getter_AddRefs(uri));

    nsCOMPtr<nsIMsgMailNewsUrl> msgUrl;
    if (uri)
      msgUrl = do_QueryInterface(uri);

    if (msgUrl)
      msgUrl->GetMsgWindow(getter_AddRefs(msgWindow));
  }

  nsresult rv;
  rv = data->mimeDecrypt->Finish(msgWindow);
  if (NS_FAILED(rv))
    return -1;

  data->mimeDecrypt = nsnull;
  return 0;
}

static char*
MimeEnig_generate(void *output_closure)
{
  fprintf(stderr, "MimeEnig_generate:\n");

  const char htmlMsg[] = "<html><body><b>GEN MSG<b></body></html>";
  char* msg = (char *) PR_MALLOC(nsCRT::strlen(htmlMsg) + 1);
  if (msg) {
    PL_strcpy(msg, htmlMsg);
  }
  return msg;
}

static void
MimeEnig_free(void *output_closure)
{
  fprintf(stderr, "MimeEnig_free:\n");
}