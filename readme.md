# hx-ext="tpl"

An **[htmx](https://htmx.org/essays/#memes)** extension that allows to select and swap existing elements.

## What it does
Gets the content (`innerHTML`) of a DOM element (like a template) and swaps it to a target.

## How it works
Add the attribute `hx-ext="tpl"` to the "triggering" element (a `button`, or whatever) and add the new attribute `hx-tpl="templateElementQueryString"` with the query string to the *source* DOM element that you want to "get" and swap to the `hx-target`.

If **`hx-trigger`** is not specified, a **`click`** event trigger will be added by default. Check the `hx-trigger` attribute in the htmx docs here: https://htmx.org/attributes/hx-trigger/

If **`hx-target`** is not specified it will target **itself**. Check the `hx-target` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-target/

If **`hx-swap`** is not specified it will swap the `innerHTML` of the `hx-tpl` element into the **`innerHTML` of the target**.
Check the `hx-target` attribute in the htmx docs here: 
https://htmx.org/attributes/hx-swap/

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

## Found a bug?
Yeah, I thought so. You can open an issue or try a pull request and we can figure it out together.

## What is the name of this? It sucks!
I call it "tpl" or "hx-tpl". If you think you have a better name reach out!

## Haiku
XHR fatigue:
longing for some elements
already in hand
