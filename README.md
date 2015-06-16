# sophy
New UI for Sophy framework

# Preview

	$ wintersmith preview

The site can now be accessed at [http://localhost:8080/sophy](http://localhost:8080/sophy)

# Deploy to gh-pages

	$ wintersmith build

	$ git add build

	$ git commit -m 'build'	

	$ git subtree push --prefix build origin gh-pages

Then, the page can be accessed at `http://[your-github-account-id].github.io/sophy`
