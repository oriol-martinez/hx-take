# hx-ext="tpl"
## Version 0.2.0

An **[htmx](https://htmx.org/essays/#memes)** ES5 extension that allows to select and swap existing elements on the DOM.

## What it does
Gets a DOM element and swaps it with/to a target.

## Use it
### Include it on a script tag after htmx using a CDN on your html.
```html
<script src="https://unpkg.com/hx-ext-tpl/dist/hx-ext-tpl.min.js"></script>
```
### or install it and use it with npm
```
npm i hx-ext-tpl
```
then require it after you have the `window.htmx` object declared.
```js
// htmx required
require('hx-ext-tpl');
// ...
```
### or include your own copy of the JavaScript file
You can find the regular and minified files that you can download and use in the dist directory.

## How it works
Add the attribute `hx-ext="tpl"` to the "triggering" element (a `button`, or whatever) and add the new attribute `hx-tpl="templateElementQueryString"` with the query string to the *source* DOM element that you want to "get" and swap to the `hx-target`.

If **`hx-trigger`** is not specified, a **`click`** event trigger will be added by default. Check the `hx-trigger` attribute in the htmx docs here: https://htmx.org/attributes/hx-trigger/

If **`hx-target`** is not specified it will target **itself**. Check the `hx-target` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-target/

If **`hx-swap`** is not specified it will swap the `innerHTML` of the `hx-tpl` element into the **`innerHTML` of the target**.
Check the `hx-target` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-swap/

### Swap styles
This extension adds additional swap styles usable with hx-swap that may come handy:
#### Move
    hx-swap="move"
Moves the `innerHTML` (the content) of the source replacing the `innerHTML` of the target.

#### Replace
    hx-swap="replace"
Replaces the `OuterHTML` of the target with the `OuterHTML` of the source.

#### Trade
    hx-swap="trade"
Swap the `InnerHTML` of the target and the source, interchanging the contents.

#### Exchange
    hx-swap="exchange"
Swap the `OuterHTML` of the target and the source, exchanging the whole elements.

### Events
A new set of events is added to ease the management and increase the potential use cases.
When an `ext="tpl"` element is triggered, it will send a generic **`extTplBefore`** (`ext-tpl-before` in kebabcase), then a specific event for the swap style, for instance, **`extTplBeforeTrade`** (`ext-tpl-before-trade` in kebabcase).
Once the swap has completed a specific swap style event (like **`extTplAfterMove`** or `ext-tpl-after-move` in kebabcase) will be sent, and then the generic **`extTplAfter`**.
This events will be sent just to the **target and its direct children on move and replace**, and **both the target and the source and their direct children on trade and exchange**.

## Examples

### Get the content
```html
    <!-- ... -->
    <button hx-ext="tpl" hx-tpl="#big-text" hx-target="#text">Get me a big text</button>
    <div id="text">
    	<p><small>small text</small></p>
    </div>
    <template id="big-text">
    	<h1>BIG TEXT</h1>
    </template>
    <!-- ... -->
```
>When the user clicks on the button the content of of the #text div will be replaced with "`<h1>BIG TEXT</h1>`".

### Append elements
```html
    <!-- ... -->
    <form method="POST" action="/formUrl" id="preferences-form">
    	<input type="text" name="first-name" placeholder="First name" />
    	<input type="text" name="last-name" placeholder="Last name" />
    
        <div id="preferences-here"></div>
    
    	<a class="btn" href="#" hx-ext="tpl" hx-tpl="#preferences-field" hx-target="#preferences-here" hx-swap="beforeend" hx-trigger="click, htmx:afterProcessNode">Add a text field</a>
    	<!-- In this example, hx-trigger has an additional htmx:afterProcessNode event, so a field is appended right on load -->
    
        <input type="submit" value="Send this thing!" />
    </form>
    <template id="preferences-field">
        <input type="text" name="preference[]" placeholder="Something to say?" class="preference-input" />
    </template>
    <!-- ... -->
```
>After loading the page and clicking the "Add a text field" button, the `#preferences-here` div will be populated with clones of the input field.

### Mix and match, the possibilities are endless!
```html
    <!-- ... -->
    <button class="btn btn-secondary" hx-ext="tpl" hx-tpl="#new-button" hx-swap="outerHTML">Click me</button>
    
    <div id="content">
        <p>This content has not been processed by htmx.</p>
    </div>
    
    <template id="new-button">
        <button class="btn btn-info" hx-ext="tpl" hx-tpl="#new-content" hx-target="#content">Click me again</button>
    </template>
    
    <template id="new-content">
        <h1>New content loaded by HTMX!</h1>
    </template>
    <!-- ... -->
```

>On the first click, the button will change itself by the one on the `#new-button` template, and clicking that new button will swap the `#content` div with the content of the template `#new-content`.

### Using the additional swap styles
```html
<!-- ... -->
<div id="up">
    <p>This is up</p>
</div>

<button class="btn btn-accent" hx-ext="tpl" hx-tpl="#up" hx-target="#down" hx-swap="exchange">
    ↕️ Swap'em!
</button>

<div id="down">
    <p>This is down</p>
</div>
```
> The divs `#up` and `#down` will exchange themselves with all their content. Clicking the button again will exchange them again, and again.

## Found a bug?
Yeah, I thought so. You can open an issue or try a pull request and we can figure it out together.

## What is the name of this? It sucks!
I call it "tpl" or "hx-tpl". If you think you have a better name reach out!

## What is with the code of this? It sucks!
It's written in ES5 JavaScript like htmx (1.9.x), the bulk of the code is a modified version of the swap function(s) of htmx. If you don't like it help me improve it, don't watch or go [elsewhere](https://react.dev/).

## Haiku

> XHR fatigue:
>
> longing for some elements
>
> already in hand

*Based on the htmx webpage haiku.*
