(function () {
    var main = document.getElementsByTagName('main')[0]
    var tod = document.getElementsByClassName('table-of-directories')[0]
    var backButton = document.getElementsByClassName('back-to-documents')[0]
    var docHeader = document.getElementsByTagName('header')[0]
    var siteHeader = document.getElementsByClassName('site-header')[0]
    var documentTitle = document.getElementById('document-title')
    var documentSubtitle = document.getElementById('document-subtitle')
    var navigation = document.getElementsByClassName('navigation')[0]
    var searchFilter = document.getElementsByClassName('search-filter')[0]

    // If subfolder was accessed directory via url, load the subfolder's pages
    if (documentTitle && documentTitle.innerText.trim()) {
        loadDocumentContent(documentTitle.innerText, 1)
    }

    // Directory navigation
    var allDirectories = document.querySelectorAll('a.tod-container')
    allDirectories.forEach(function (directory) {
        directory.addEventListener('click', function (event) {
            event.stopPropagation()
            event.preventDefault()
            var target = event.target;
            while (target !== this) {
                // Goes to parent node if child element is clicked
                target = target.parentNode;
            }
            // this tocId is basically the directory path
            // e.g. /Document%20One/ with spaces replaced with underscores
            var tocId = target.id.replace(/^dir_/, 'toc_')
            if (showToc(tocId)) {
                // TODO: May break if user changes the html
                // Loads on document click if it hasnt loaded yet
                var directoryTitle = target.innerText.trim()
                loadDocumentContent(directoryTitle, 1)
            }
        }, true)
        // Load pages in background based on directory order
        var directoryTitle = directory.innerText.trim()
        loadDocumentContent(directoryTitle, 0)
    })

    // Returns whether corresponding toc is found and displays it
    var showToc = function (tocId) {
        var correspondingToc = document.getElementById(tocId)
        if (correspondingToc) {
            document.querySelectorAll('.contents').forEach(function (toc) {
                toc.hidden = true
            })
            correspondingToc.hidden = false
            if (tod) tod.classList.add('hidden')
            return true
        }
        return false
    }

    if (backButton) {
        // Reminder: If there is only one document, backButton is hidden
        backButton.addEventListener('click', function () {
            tod.classList.remove('hidden')
        })
    }

    //  Nav bar expansion and selection
    var setSelectedAnchor = function () {
        var path = window.location.pathname
        var hash = window.location.hash

        // Make the nav - link pointing to this path selected
        var selectedBranches = document.querySelectorAll('li.nav-branch.expanded')
        for (var i = 0; i < selectedBranches.length; i++) {
            selectedBranches[i].classList.remove('expanded')
        }
        var selectedAnchors = document.querySelectorAll('a.nav-link.selected')
        for (var i = 0; i < selectedAnchors.length; i++) {
            selectedAnchors[i].classList.remove('selected')
        }

        selectedAnchors = document.querySelectorAll('a.nav-link[href$="' + path + '"]')
        if (selectedAnchors.length > 0) {
            let parentLinkNode = selectedAnchors[0].parentNode
            parentLinkNode.classList.add('expanded')
            // Checks if there are sublinks (contains <a> and <ul> elements)
            if (parentLinkNode.children.length === 1) {
                // Closes menu if there are no sublinks
                window.dispatchEvent(new Event('link-click'))
            }
        }
        if (hash.length > 0) {
            selectedAnchors = document.querySelectorAll('a.nav-link[href$="' + path + hash + '"]')
            if (selectedAnchors.length > 0) {
                selectedAnchors.forEach(function (anchor) {
                    anchor.classList.add('selected')
                })
            }
        }
    }

    // Initial anchoring
    setSelectedAnchor()

    // HTML5 History
    // =============================================================================
    // Setup HTML 5 history for single page goodness

    document.body.addEventListener('click', function (event) {
        // Check if its within an anchor tag any any point
        // Traverse up its click tree and see if it affects any of them
        // If it does not find anything it just terminates as a null
        var anchor = event.target
        while (anchor && anchor.tagName !== 'A') {
            anchor = anchor.parentNode
        }
        if (anchor && (anchor.host === '' || anchor.host === window.location.host) && anchor.classList.contains('nav-link') && !anchor.hasAttribute('download')) {
            // Prevent page load
            event.preventDefault()
            event.stopPropagation()
            if (anchor.hash.length > 0) {
                if ((window.location.pathname + window.location.hash).endsWith(anchor.hash)) {
                    // If clicked on the same anchor, just scroll to view
                    scrollToView()
                    return
                }
                window.location = anchor.hash
            } else {
                window.location = '#'
            }
            // This does not trigger hashchange for IE but is needed to replace the url
            history.pushState(null, null, anchor.href)
        }
    }, true)

    // Event when path changes
    // =============================================================================
    var onHashChange = function (event) {
        var path = window.location.pathname
        var page = pageIndex[path]
        // Only reflow the main content if necessary
        if (page) {
            var tocId = 'toc_' + page.dir.replace(/\s/g, '_')
            showToc(tocId)
            setSelectedAnchor()
            loadPageContent(page, 2).then(function (pageContent) {
                searchFilter.innerText = page.documentInfo[0] // document title
                searchFilter.classList.remove('hidden')
                // Don't compare iframes
                if (main.innerHTML.trim().replace(/\<iframe.*\<\/iframe\>/g, '') !== pageContent.trim().replace(/\<iframe.*\<\/iframe\>/g, '')) {
                    main.innerHTML = pageContent
                    document.title = page.title
                    documentTitle.innerText = page.documentInfo[0] // document title
                    documentSubtitle.innerText = page.documentInfo[1] // document subtitle
                    docHeader.classList.remove('index')
                }
                // Make sure it is scrolled to the anchor
                scrollToView()

                // Hide menu if sub link clicked or clicking on search results        
                if (window.location.hash.replace('#', '').length > 0 || navigation.classList.contains('hidden')) {
                    window.dispatchEvent(new Event('link-click'))
                }
                highlightBody()
            })
        }
    }

    var scrollToView = function () {
        var id = window.location.hash.replace('#', '')
        // minus 1 to hide the border on top
        if (id.length > 0) {
            var anchor = document.getElementById(id)
        }
        if (anchor) {
            var topOffset = siteHeader.offsetHeight
            if (!isMobileView()) {
                topOffset += docHeader.clientHeight
            }
            var top = anchor.offsetTop - topOffset
            window.scrollTo(0, top)
        }
    }

    // Dont use onpopstate as it is not supported in IE
    window.addEventListener('hashchange', onHashChange)

    // Scroll to view onload
    window.onload = scrollToView
})()