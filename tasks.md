### i.1 Selectors

A large part of scraping websites is getting the proper elements to extract the data from. As explained in the video, this is done using selectors. Writing good selectors is therefore paramount to creating a crawler that can deal with dynamic environments and platform updates.

- **Specificity**: Use selectors that are as specific as possible to the elements you want to target. Always test whether your selector selects just the element(s) you intended, or if stray elements are being picked up.
- **Use IDs and Classes**: Utilize unique IDs and well-defined classes whenever possible. IDs are unique to each element on a page, making them the preferred method of selecting. Classes, on the other hand, are reusable and could therefore target multiple similar elements. When selecting on a class, try to identify classes that seem as little style-related as possible, as those are very likely to change in the future.
    - **Important**: Many platforms use randomly/dynamically generated IDs and classes, often easy to spot by a couple random-looking digits and letters. Needless to say, do not use these as is! They are clearly meant to change and are thus not sustainable in the long term. If you feel that you *must* somehow use them in your selector, match on the stable part of the ID/classname (see @image.png).
- **Dynamic Attributes**: Pay attention to dynamic attributes such as `data-` attributes, which can also be used to select items and are often good candidates for selectors.
- **Avoid Inline Styles**: Try to avoid relying on inline styles for selecting elements. Inline styles can change frequently and are less reliable for long-term scraping tasks.
- **Avoid element hierarchy selecting**: Try to avoid selecting an element using parent child relations (i.e. `div > div > span`) as a single change in this hierarchy might break the selector. If you do use this way of selecting, attempt to add additional features to the children to make it as specific as possible. Omitting the direct child relation (`>`) may be less sensitive to hierarchy changes, but runs the risk of selecting unwanted elements.

### i.2 Interactions

Getting data from a website is relatively easy. You check and wait for the data to be there, and then you read it out. But interacting like a human would do is more prone to errors. If you click a button, you need to wait for the website to process that, before doing another interaction. This is best done using the following functions:

```tsx
(method) Page.waitForSelector<string>(selector: string, options?: puppeteer.WaitForSelectorOptions | undefined): Promise<puppeteer.ElementHandle<Element> | null>
(method) Page.waitForNetworkIdle(options?: puppeteer.WaitForNetworkIdleOptions | undefined): Promise<void>
(method) Page.waitForFunction(pageFunction: Func | string, options?: puppeteer.FrameWaitForFunctionOptions | undefined, ...args: Params): Promise<void>
```

The `waitForSelector` function will help wait for certain selectors to appear. This is much more reliable than waiting x seconds and hoping the element has appeared within that time.

The `waitForNetworkIdle` function will wait until the page is loaded in, which is often used at the start of the program after the url is entered. This can also be done within the `goto` function: `

The `waitForFunction` function will run a user specified function on the page until it evaluates to a truthy value. This allows for more complex waiting conditions than `waitForSelector`. Functions can be run at a specified interval (`options.polling=1000`), for every DOM mutation (`options.polling='mutation'`), or on every animation frame (`options.polling='raf'`).

```tsx
await page.goto(url, { waitUntil: 'networkidle2', timeout: timeout });
```

### i.3 TASK: Scraping marktplaats.nl

For this task, you have to be on the right branch. Find out which branches are in the repository, and make sure you have the code for the main or master branch before you. Do this by first listing all the branches, and using *git checkout* to get the correct branch. Look up which commands to use and how to use them.

Running the following line will open up a browser that opens marktplaats.nl:

```jsx
yarn scrape-marktplaats
```

Expand the *scrape-marktplaats.ts* file to do the following:

- Open the search page for tandems
- Find the URLs for all listings on the page
- Open the listings in new pages
- For each listing, scrape and print the following to the console:
    - price
    - name of the listing
    - url of the listing
- Close everything. The script should complete on its own, without errors.

// https://www.marktplaats.nl/q/tandems/


The more functions you use, and the better you define them, the easier it will get later on! Also, make sure the code does not contain linter errors. You can check this using the following command:

```jsx
yarn lint
```

If the script works, make a git commit. You can either use the command line, or the VSCode interface to do this. Search for sources online on information on how to do this. After you made the commit, let someone check your work, up to this point.

## ii. Abstraction

Now that you have a working markplaats.nl scraper, we are going to work on other scrapers. The goal is to make a framework that will be able to allow for scraping many websites. So while we keep it at three for this project, thought has to put into making it sustainable for any number.

### ii.1 TASK: Abstract the scraping process

The following part of the project is in the branch *scraper*. Make sure you are on the right branch. If you need the file back that you edited, you can get it on this branch by using the following command:

```jsx
git checkout <branch> <file>
```

This will overwrite everything on the current branch, however. Look at the comments that are added after the console.log. They will be overwritten.

When on the right branch, look into the *platforms* folder and the *index.ts* file. The goal is to separate the logic of the websites from the logic of the managing. To achieve this, follow the list below. Make sure each step works before going on to the next, this makes debugging easier.

1. Create platform implementations in the *platforms* folder. Create classes for each platform and make sure they inherit from the base. Create the functions and throw errors in these functions to show they are not yet implemented. No need yet to fully implement them. The platforms are:
    1. marktplaats.nl (since you already have the code for this one, implement the functions too. This will make testing easier.)
    2. mediamarkt.nl
    3. asos.com
2. Get an instance of the correct platform. Do not use a switch case or if else chain for this, since that is not maintainable for larger lists of platforms. To test if this works correctly, you can print out the platform name of the instance.
3. Write some logic that first collects enough URLs to scrape. You should be able to support 100 URLs. Test it out with marktplaats.nl.
4. Write some logic that scrapes the listing pages. Test it out with marktplaats.nl again.
5. Write all the results to *result.json* when you are finished.
6. Commit all your changes once you are finished.

Let someone check up on what you have written so far to make sure the commit and code looks good.

### ii.2 TASK: Merge implementations with Git

Another implementation of the marktplaats.nl scraper can be found at the branch marktplaats. Merge this implementation into the current branch using this command:

```jsx
git merge <branch>
```

This will probably create a merge conflict, since the code is not the same, and has been made in the same file at the same place. Solve this merge conflict using any editor/interface. VSCode is recommended, but if you have experience in other editors, feel free to use them.

You will want to keep your own *scrapeItemPage* and use the *scrapeSearchPage* from the marktplaats branch.

### ii.3 TASK: Finish the other implementations

For the other 2 platforms, finish the implementations. Do this by:

1. First creating a branch with the name of the platform
2. Making the necessary changes.
3. Commit the changes.
4. Merge the branch into the scraper branch.

When you are done, you should be able to run the following commands without any problem:

yarn scrape marktplaats tshirt 20
yarn scrape asos crocs 20
yarn scrape mediamarkt phone 20
yarn scrape marktplaats tshirt 0
yarn scrape marktplaats tshirt 100

