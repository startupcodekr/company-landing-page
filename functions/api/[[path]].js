/**
 * Cloudflare Pages Functions - Forwarding to Worker logic
 */
import worker from '../../src/index.js';

export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  return worker.fetch(request, env, { waitUntil });
}
