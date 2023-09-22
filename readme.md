# hx-take 🤏
## Version 0.3.0

An **[htmx](https://htmx.org/essays/#memes)** extension that allows to take an existing element and copy, move or exchange it into a target. Like this:
```html
<div hx-ext="take">
    <div id="here">
        <p>This content is going to be replaced...</p>
    </div>
    <template id="the-content">
        <p>...with this other content...</p>
    </template>
    <button hx-take="#the-content" hx-target="#here">
        ... when this button is clicked.
    </button>
</div>
```
See it for yourself and experiment with it in the playground page.

## Use it
### Include it on a script tag, after htmx, using a CDN on your html.
```html
<script stc="https://unpkg.com/hx-take/dist/hx-take.min.js"></script>
```
### or install it and use it with npm
```bash
npm install hx-take
```
then require it after you have the `window.htmx` object declared.
```js
window.htmx = require('htmx.org');
require('hx-take');
```
### or include your own copy of the JavaScript file
You can find the regular and minified files that you can use in the dist directory of the repository.

## How it works
Add "`take`" to the [htmx extension attribute](https://htmx.org/attributes/hx-ext/), like `hx-ext="take"`, to a parent element (the `body` or a container element) to enable hx-take on the container element and all its children. You can also just add the `hx-ext="take"` attribute into the "triggering" element itself.

Use the attribute **`hx-take`** to select an existing element on the document specifying a CSS query, if the query returns multiple elements it will always get the first one.
Like`hx-take="#hidden-content"`or `hx-take=".info-box"`.

If **`hx-trigger`** is not specified, a **`click`** event trigger will be added by default. Check the `hx-trigger` attribute in the htmx docs here: https://htmx.org/attributes/hx-trigger/

If **`hx-target`** is not specified it will target **itself**. Check the `hx-target` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-target/

If **`hx-swap`** is not specified it will copy the `innerHTML` of the selected element with `hx-take` into the **`innerHTML` of the target**.
Check the `hx-swap` attribute in the htmx docs here: https://htmx.org/attributes/hx-swap/.
Also check the "Advanced swap specifications" section to read about the new swap mechanics that hx-take adds.

**`hx-select`** can be used to select part of the taken content specifying a CSS query.
Check the `hx-select` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-select/
> `hx-select`is ignored with the `exchange` swap mode. Read more about swap modes on the "Advanced swap specifications" section.

### Shadow DOM compatibility
**hx-take** is compatible with elements that use **shadow DOM** 👻, like HTML `<template>` tags. If the target (or a taken element too in case of using the exchange swap mode) has a `#document-fragment` (js `content`property) it will modify the contents of the fragment.

### Advanced swap specifications
This extension adds 4 additional swap methods using the [htmx swap modifiers syntax](https://htmx.org/attributes/hx-swap/#modifiers). They work together to specify the swap behavior of the taken and the target elements.
#### Mode modifiers: `move:`, `copy:`, `exchange:`
The "mode" modifiers specify how will the **taken element content** be swapped into the target element. These modifiers accept `innerHTML` (or the `inner` alias) and `outerHTML` (or the `outer` alias) as values.
- **`copy:`** (default) 🟦 ➡️ 🟦
Copies the innerHTML or outerHTML of the taken element to the target element.
`copy:innerHTML` or `copy:inner`, `copy:outerHTML` or `copy:outer`.
- **`move:`** ⬜️ ➡️ 🟦
Move the innerHTML or outerHTML of the taken element to the target element.
`move:innerHTML` or `move:inner`, `move:outerHTML` or `move:outer`.
- **`exchange:`** 🟥 ↔️ 🟦
Exchanges the innerHTML or outerHTML of the taken element with the target element.
`exchange:innerHTML` or `exchange:inner`, `exchange:outerHTML` or `exchange:outer`.
This mode is not compatible with the `hx-select`attribute.

#### Target modifier: `to:`
The "`to:`" modifier specifies how will the moved, copied or exchanged content from the taken element be swapped **into the target element**. The target modifier values are the standard [htmx swap styles](https://htmx.org/attributes/hx-swap/):
- `to:innerHTML` or `to:inner` (default): Replace the inner html of the target element with the taken content. 
- `to:outerHTML` or `to:outer`: Replace the entire target element with the taken element content. 
- `to:beforebegin`: Insert the taken content before the target element. 
- `to:afterbegin`: Insert the taken content before the first child of the target element. 
- `to:beforeend`: Insert the taken content after the last child of the target element. 
- `to:afterend`: Insert the taken content after the target element. 
- `to:delete`: Deletes the target element regardless of the taken content.
- `to:none`: Does not append content from the taken content.
#### Swap specifications aliases
Some common swap specifications have aliases:
- **`hx-swap="move"`**: alias of `hx-swap="move:inner to:inner"`. Moves the content of the taken element to the content of the target.
- **`hx-swap="replace"`**: alias of `hx-swap="move:outer to:outer"`. Replaces the target element with the taken element.
- **`hx-swap="copy"`**: alias of `hx-swap="copy:inner to:inner"`. Replace the target with a copy of the taken element.
- **`hx-swap="trade"`**: alias of `hx-swap="exchange:inner to:inner"`. Swap the content of the taken element and the target, exchanging the contents.
- **`hx-swap="exchange"`**: alias of `hx-swap="exchange:outer to:outer"`. Swap the content of the taken element and the target, exchanging the contents.
- **`hx-swap="append"`**: alias of `hx-swap="copy:inner to:beforeend"`. Put a copy of the taken element at the end of the target content.
- **`hx-swap="prepend"`**: alias of `hx-swap="copy:inner to:afterbegin"`. Put a copy of the taken element at the beginning of the target content.
#### Using htmx swap modifiers
As the `hx-take`swap modifiers are additions to the existing swap modifiers of htmx, they are all compatible. So `hx-swap="copy:inner to:beforeend swap:250ms"` will work, adding a delay of 250ms to the swap.

#### `hx-swap-oob`compatibility
If the taken element content includes an element with the [swap out of band attribute](https://htmx.org/attributes/hx-swap-oob/), it will be processed.

### Events
A set of events is triggered on a `hx-take` swap on both the taken element and the target element.
When elements are triggered, it will send a generic **`extTakeBefore`** (`ext-take-before` in kebabcase). Then a more specific **`extTakeBeforeTarget`** and **`extTakeBeforeTaken`** events are triggered on the target or taken elements. Finally a **`extTakeBeforeTarget{swap style}`** and **`extTakeBeforeTaken{swap style}`** will be triggered on the elements. `{swap style}` being the swap style of the element, for instance **`extTakeBeforeTargetAfterbegin`** or **`extTakeBeforeTakenInnerHTML`**.
After the swap is performed all the events are triggered again with  `After` instead of `Before`:
**`extTakeAfter`**, 
**`extTakeAfterTarget`** and **`extTakeAfterTaken`**,
**`extTakeAfterTarget{swap style}`** and **`extTakeAfterTaken{swap style}`**.

### Classes
A set of classes is added during the swap to the taken and target elements depending on their role and swap style.
The generic **`hx-take-swapping`** is added to both elements.
**`hx-take-swapping-taken`** or **`hx-take-swapping-target`** to the specific element depending on its role.
**`hx-take-swapping-{swap style}`,** like **`hx-take-swapping-beforeend`**, specifying the swap style of both the target and taken elements.

## Examples
Play around with `hx-take`in the playground page.

### Get the content
```html
    <button hx-ext="take" hx-take="#big-text" hx-target="#text">Get me a big text</button>
    <div id="text">
    	<p><small>small text</small></p>
    </div>
    <template id="big-text">
    	<h1>BIG TEXT</h1>
    </template>
```
>When the user clicks on the button ,the content of the `#text` div will be replaced with "`<h1>BIG TEXT</h1>`".

### Append elements
```html
<form method="POST" action="/post-url" hx-ext="take">
    <div id="fields">
        <input type="text" name="first-name" placeholder="First name" />
        <input type="text" name="last-name" placeholder="Last name" />
        <input class="extra-field" type="text" name="extra[]" placeholder="Extra field" />
    </div>

    <a class="btn" href="#" hx-take=".extra-field" hx-target="#fields" hx-swap="copy:outer to:beforeend">Add a text field</a>
    <input type="submit" value="Send this thing!" />
</form>
```
>Clicking the "Add a text field" button will add copies of the extra field at the end of the `#fields`div content. `ht-take=".extra-field"`will select just the first element with that class.
>⚠️ Be careful when using the `copy:` swap mode, you may duplicate elements with the same `id`.

### Replace elements that perform more actions
```html
    <button class="btn btn-secondary" hx-take="#new-button" hx-swap="outerHTML">Click me</button>
    
    <div id="content">
        <p>This content has not been processed by hx-take.</p>
    </div>
    
    <template id="new-button">
        <button class="btn btn-info" hx-take="#new-content" hx-target="#content">Click me again</button>
    </template>
    
    <template id="new-content">
        <h1>New content loaded by hx-take!</h1>
    </template>
```

>On the first click, the button will change itself by the one on the `#new-button` template, and clicking that new button will swap the `#content` div with the content of the template `#new-content`.

### Using the additional swap behaviors
```html
<!-- ... -->
<div id="up">
    <p>This is up</p>
</div>

<button class="btn btn-accent" hx-take="#up" hx-target="#down" hx-swap="exchange">
    ↕️ Swap'em!
</button>

<div id="down">
    <p>This is down</p>
</div>
```
> The divs `#up` and `#down` will exchange themselves with all their content. Clicking the button again will exchange them again, and again.

## Found a bug?
Yeah, I thought so. You can open an issue or try a pull request and we can figure it out.

## What is with the code of this? Looks old.
It's written in ES5 JavaScript like htmx (1.9.x), the bulk of the code is a modified version of the swap function(s) of htmx.

## Haiku

> XHR fatigue:
> longing for some elements
> already in hand

*Based on the htmx webpage footer haiku.*