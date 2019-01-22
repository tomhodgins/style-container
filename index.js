import parseStylesheet from 'https://unpkg.com/parse-css-stylesheet'
import processRules from 'https://unpkg.com/process-css-rules'
import stringifyStylesheet from 'https://unpkg.com/stringify-css-stylesheet'
import jsincss from 'https://unpkg.com/jsincss/index.vanilla.js'

function iframeMatchMedia(container, stylesheet) {

  // Find or create <iframe> for testing media queries
  let iframe = document.querySelector('iframe#style-container-iframe')
  if (iframe === null) {
    iframe = document.createElement('iframe')
    iframe.id = 'style-container-iframe'
    iframe.style.cssText = `
      position: fixed;
      bottom: -100vh;
      right: -100vw;
      pointer-events: none; 
    `
    document.body.appendChild(iframe)
  }

  // Resize test <iframe> to match style container
  if (iframe.width !== container.offsetWidth) {
    iframe.width = container.offsetWidth
  }
  if (iframe.height !== container.offsetHeight) {
    iframe.height = container.offsetHeight
  }

  // Return stringified stylesheet if media query is true
  return iframe.contentWindow.matchMedia(stylesheet.media.mediaText).matches
  ? stringifyStylesheet(stylesheet)
  : ''
}

export default function(dom = document) {

  // Find all <style media=none> inside <style-container> in supplied DOM tree
  return dom.querySelectorAll('style-container style[media="none"]').forEach((tag, index) => {

    const container = tag.closest('style-container')
    const scoped = document.createElement('style')
    let css = ''

    processRules(
      parseStylesheet(tag.textContent),
      rule => {

        // prefix selector
        if (rule.selectorText) {
          rule.selectorText = rule.selectorText
            .split(/(?!\B"[^"]*),(?![^"]*"\B)/)
            .map(selector => `[data-container-${index}] ` + selector)
            .join(', ')

        // extract media queries
        } else if (rule.media) {
          jsincss(() => iframeMatchMedia(container, rule))
        }

        // copy all top-level rules to scoped output
        if (rule.parentRule === null) {
          css += rule.cssText
        }
      }
    )

    scoped.textContent = css
    container.style.display = 'block'
    container.dataset[`container-${index}`] = ''
    return document.head.appendChild(scoped)
  })
}