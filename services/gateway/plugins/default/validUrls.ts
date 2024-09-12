import {
  HookEventType,
  PluginContext,
  PluginHandler,
  PluginParameters,
} from '../types';
import dns from 'dns';
import { getText } from '../utils';

export const handler: PluginHandler = async (
  context: PluginContext,
  parameters: PluginParameters,
  eventType: HookEventType
) => {
  let error = null;
  let verdict = false;
  let data = null;

  try {
    let content = getText(context, eventType);

    // Find all URLs in the content, they may or may not start with http(s)
    const urls = content.match(/(https?:\/\/[^\s]+)/g) || [];
    const onlyDNS = parameters.onlyDNS || false;

    if (onlyDNS) {
      verdict = (await Promise.all(urls.map(checkDNS))).every(
        (result) => result
      );
    } else {
      verdict = (await Promise.all(urls.map(checkUrl))).every(
        (result) => result
      );
    }

    data = { validURLs: urls };
  } catch (e) {
    error = e as Error;
  }

  return { error, verdict, data };
};

async function checkUrl(target: string): Promise<boolean> {
  const controller = new AbortController();
  const { signal } = controller;
  let timeoutId: NodeJS.Timeout = setTimeout(() => {}, 0);

  try {
    // Set a timeout to abort the request if it takes too long
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    const response = await fetch(target, { method: 'GET', signal });
    clearTimeout(timeoutId); // Clear the timeout upon successful fetch
    controller.abort(); // Ensure the request is aborted after the fetch
    return response.ok;
  } catch (error) {
    clearTimeout(timeoutId); // Ensure the timeout is cleared on error
    controller.abort(); // Ensure the request is aborted after the fetch
    return false;
  }
}

async function checkDNS(target: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(target);
    dns.lookup(parsedUrl.hostname, (err) => {
      resolve(err === null);
    });
  });
}
