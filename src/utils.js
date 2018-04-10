import React from 'react';

export function renderChildren(children, fetchProps) {
  if (typeof children === 'function') {
    const childrenResult = children(fetchProps);
    if (typeof childrenResult === 'function') {
      return renderChildren(childrenResult, fetchProps);
    } else {
      return childrenResult;
    }
  } else if (React.Children.count(children) === 0) {
    return null;
  } else {
    // DOM/Component children
    // TODO: Better to check if children count === 1 and return null otherwise (like react-router)?
    //       Currently not possible to support multiple children components/elements (until React fiber)
    return React.Children.only(children);
  }
}

export const parseBody = (response, mapping = {}) => {
  const contentType = response.headers.get('Content-Type');

  // Do not attempt to parse empty response
  if (contentType === null) {
    return Promise.resolve(null)
  }

  const mimeType = contentType.split(';')[0].trim();

  if (mimeType in mapping) {
    // Direct mapping of `Content-Type`/`mimeType` to response handler
    return mapping[mimeType](response)
  } else if (
    mimeType === 'application/json' ||
    mimeType === 'text/json' ||
    /\+json$/.test(mimeType) // ends with "+json"
  ) {
    // https://mimesniff.spec.whatwg.org/#json-mime-type
    return ('json' in mapping) ? mapping['json'](response) : response.json()
  } else if (mimeType === 'text/html') {
    // https://mimesniff.spec.whatwg.org/#html-mime-type
    return ('html' in mapping) ? mapping['html'](response) : response.text()
  } else if (
    mimeType === 'application/xml' ||
    mimeType === 'text/xml' ||
    /\+xml$/.test(mimeType) // ends with "+xml"
  ) {
    // https://mimesniff.spec.whatwg.org/#xml-mime-type
    return ('xml' in mapping) ? mapping['xml'](response) : response.text()
  } else {
    return ('other' in mapping) ? mapping['other'](response) : response.arrayBuffer()
  }
};
