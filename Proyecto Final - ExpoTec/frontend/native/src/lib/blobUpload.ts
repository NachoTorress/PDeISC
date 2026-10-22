export type PhotoUploadOptions = {
  token: string;
  signal: AbortSignal;
  progress: (percent: number) => void;
};

// Protocolo PUT del SDK oficial @vercel/blob 2.8: sólo usa el permiso temporal de esta foto.
export function photoUploadRequest(
  pathname: string,
  token: string,
  body: Blob,
) {
  if (
    !/^incoming\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(
      pathname,
    ) ||
    !/^vercel_blob_client_[A-Za-z0-9]+_/.test(token)
  )
    throw new Error("No pudimos preparar la carga. Volvé a elegir la foto.");
  return {
    url: `https://vercel.com/api/blob/?${new URLSearchParams({ pathname })}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": body.type,
      "x-content-type": body.type,
      "x-content-length": String(body.size),
      "x-vercel-blob-access": "private",
      "x-vercel-blob-store-id": token.split("_")[3],
      "x-api-version": "13",
    },
  };
}

export async function putPhoto(
  pathname: string,
  body: Blob,
  options: PhotoUploadOptions,
) {
  options.signal.throwIfAborted();
  const request = photoUploadRequest(pathname, options.token, body);
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = (error?: Error) => {
      options.signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve();
    };
    xhr.open("PUT", request.url);
    xhr.timeout = 120000;
    Object.entries(request.headers).forEach(([key, value]) =>
      xhr.setRequestHeader(key, value),
    );
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        options.progress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      finish(
        xhr.status >= 200 && xhr.status < 300
          ? undefined
          : new Error("No pudimos subir la foto. Volvé a intentarlo."),
      );
    xhr.onerror = xhr.ontimeout = () =>
      finish(
        new Error(
          "Se interrumpió la carga. Revisá la conexión y volvé a elegir la foto.",
        ),
      );
    xhr.onabort = () => finish(new Error("Carga cancelada."));
    options.signal.addEventListener("abort", abort, { once: true });
    if (options.signal.aborted) {
      finish(new Error("Carga cancelada."));
      return;
    }
    xhr.send(body);
  });
}
