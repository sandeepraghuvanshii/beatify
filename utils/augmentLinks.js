// utils/augmentLinks.js
import { createDownloadLinks, createImageLinks } from "./links.js";
import { extractTokenFromPermaUrl } from "./token.js";

/**
 * Recursively augment upstream JSON:
 * - decrypt encrypted_media_url and related fields into downloadLinks
 * - generate imageLinks for image fields
 * - extract token from perma_url and add token
 * - remove encrypted_* fields from the object
 * - add consolidated urls array and bestUrl
 *
 * Mutates the input object in place and returns it.
 */
export function augmentMediaLinks(root) {
  if (!root || typeof root !== "object") return root;

  const visited = new WeakSet();

  function findEncrypted(node) {
    if (!node || typeof node !== "object") return null;
    return (
      node.encrypted_media_url ||
      node.encrypted_drm_media_url ||
      node.encrypted_cache_url ||
      node.more_info?.encrypted_media_url ||
      node.more_info?.encrypted_drm_media_url ||
      node.more_info?.encrypted_cache_url ||
      null
    );
  }

  function findImage(node) {
    if (!node || typeof node !== "object") return null;
    return node.image || node.more_info?.image || null;
  }

  function findPerma(node) {
    if (!node || typeof node !== "object") return null;
    return node.perma_url || node.more_info?.perma_url || null;
  }

  function removeEncryptedFields(node) {
    if (!node || typeof node !== "object") return;
    const keys = [
      "encrypted_media_url",
      "encrypted_cache_url",
      "encrypted_drm_cache_url",
      "encrypted_drm_media_url",
    ];
    for (const k of keys) {
      if (k in node) delete node[k];
      if (node.more_info && k in node.more_info) delete node.more_info[k];
    }
  }

  function consolidateUrls(node) {
    if (!node || typeof node !== "object") return;
    const urls = [];

    // prefer vlink if present
    if (node.vlink) urls.push({ type: "vlink", url: node.vlink });

    // include downloadLinks if present
    if (Array.isArray(node.downloadLinks) && node.downloadLinks.length) {
      for (const dl of node.downloadLinks) {
        if (dl && dl.url)
          urls.push({ type: dl.quality || "download", url: dl.url });
      }
    }

    // fallback to more_info.vlink
    if (!urls.length && node.more_info?.vlink) {
      urls.push({ type: "vlink", url: node.more_info.vlink });
    }

    if (urls.length) {
      node.urls = urls;
      node.bestUrl = urls[0].url;
    }
  }

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (visited.has(node)) return;
    visited.add(node);

    // decrypt encrypted media and attach downloadLinks
    const encrypted = findEncrypted(node);
    if (encrypted && !node.downloadLinks) {
      try {
        const links = createDownloadLinks(encrypted);
        if (Array.isArray(links) && links.length) node.downloadLinks = links;
      } catch (e) {
        console.warn("augmentMediaLinks: decryption failed", e?.message || e);
      }
    }

    // image -> imageLinks
    const image = findImage(node);
    if (image && !node.imageLinks) {
      try {
        const imgs = createImageLinks(image);
        if (Array.isArray(imgs) && imgs.length) node.imageLinks = imgs;
      } catch (e) {
        console.warn(
          "augmentMediaLinks: image link generation failed",
          e?.message || e,
        );
      }
    }

    // perma_url -> token
    const perma = findPerma(node);
    if (perma && !node.token) {
      try {
        const token = extractTokenFromPermaUrl(perma);
        if (token) node.token = token;
      } catch (e) {
        // ignore extraction errors
      }
    }

    // prefer vlink from more_info
    if (!node.vlink && node.more_info?.vlink) {
      node.vlink = node.more_info.vlink;
    }

    // remove encrypted fields
    removeEncryptedFields(node);

    // recurse into children
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) {
        for (const item of val) walk(item);
      } else if (val && typeof val === "object") {
        walk(val);
      }
    }

    // consolidate urls after children processed
    consolidateUrls(node);
  }

  walk(root);
  return root;
}
