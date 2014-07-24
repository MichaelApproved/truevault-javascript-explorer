/* 
 * Examples of how to use the TrueVault Explorer JavaScript Lib
 */
jQuery(document).ready(function() {
	/**
	 * Use the cookie values from the document
	 */
	jQuery('#api-key').val(jQuery.cookie('api-key'));
	jQuery('#account-id').val(jQuery.cookie('account-id'));

	var saveApiSettings = (jQuery.cookie('save-api-details') === "true");
	jQuery('#save-api-details').prop('checked', saveApiSettings);

	var displayAsModal = (jQuery.cookie('display-in-editor') === "true");
	jQuery('#display-in-editor').prop('checked', displayAsModal);

	/**
	 * Only after the settings have been repopulated, add
	 * change event functions so settings will be saved
	 * when the switches are used.
	 */
	jQuery('#save-api-details').change(function() {
		setApiValues();
	});
	jQuery('#display-in-editor').change(function() {
		//Always save the checkbox setting so the user won't have to keep turning it off.
		//This can be saved beyond the session (1 year/365 days).
		jQuery.cookie('display-in-editor', jQuery('#display-in-editor').is(':checked'), {expires: 365});
	});



	/**
	 * Find all vaults for the account when the button is clicked.
	 */
	jQuery('.btn.find-vaults').click(function() {
		//set the settings from input fields, clean up the data a little and save values (if chosen).
		setApiValues();

		//If we have the API information, try to get all vaults.
		if (checkApiValues()) {
			//make the request to find all vaults and pass the displayAllVaults as a callback function.
			tvExplorer.vaults.findAll(displayAllVaults);
		}

		//return false so the page doesn't scroll to the top (href='#')
		return false;
	});

	/**
	 * Create a new document
	 */
	jQuery('.btn.create-new-schema').click(function() {
		//set the settings from input fields, clean up the data a little and save values (if chosen).
		setApiValues();

		//If we have the API information, try to get all vaults.
		if (checkApiValues()) {
			//Set the details for the editor so we'll know how to handle a save request.
			jQuery('#modal-create-document').data('mode', 'create');
			jQuery('#modal-create-document').data('type', 'schema');


			//make the request to find all vaults and pass the displayAllVaults as a callback function.
			tvExplorer.vaults.findAll(loadVaultDropdown);
		}

		//return false so the page doesn't scroll to the top (href='#')
		return false;
	});

	/**
	 * Create a new document
	 */
	jQuery('.btn.create-new-document').click(function() {
		//set the settings from input fields, clean up the data a little and save values (if chosen).
		setApiValues();

		//If we have the API information, try to get all vaults.
		if (checkApiValues()) {
			jQuery('#modal-create-document').data('mode', 'create');
			jQuery('#modal-create-document').data('type', 'document');

			//make the request to find all vaults and pass the displayAllVaults as a callback function.
			tvExplorer.vaults.findAll(loadVaultDropdown);
		}

		//return false so the page doesn't scroll to the top (href='#')
		return false;
	});

	initializeAceEditor();
});

function initializeAceEditor() {
	//Activate the editor and set the values
	var editor = ace.edit('ace-editor');
	editor.setTheme("ace/theme/merbivore");
	editor.setDisplayIndentGuides(true);
	editor.setShowFoldWidgets(true);

	//Set a new custom variable to originalValue so it could be tested against when there's content.
	editor.originalValue = '';

	var editorSession = editor.getSession();
	editorSession.setMode("ace/mode/json");
	editorSession.setFoldStyle('markbeginend');
	//Change the color of the cancel button depending on if there's content in the editor
	editorSession.on('change', function() {
		var editor = ace.edit('ace-editor');
		var editorSession = editor.getSession();

		var modal = jQuery('#ace-editor').closest('.modal.edit');

		if (editorSession.getValue() === editor.originalValue) {
			if (jQuery('.btn.cancel', modal).hasClass('btn-danger')) {
				jQuery('.btn.cancel', modal).removeClass('btn-danger');
				jQuery('.btn.cancel', modal).addClass('btn-warning');

				//Cancel the function that warns before being allowed to close the browser
				window.onbeforeunload = null;
			}
		} else {
			if (jQuery('.btn.cancel', modal).hasClass('btn-warning')) {
				jQuery('.btn.cancel', modal).removeClass('btn-warning');
				jQuery('.btn.cancel', modal).addClass('btn-danger');

				//Set the function that warns before being allowed to close the browser
				window.onbeforeunload = warnBeforeClosing;
			}
		}
	});

	jQuery('.modal.edit').on('hide.bs.modal', function(e) {
		//Get the editor
		var editor = ace.edit('ace-editor');
		var text = editor.getSession().getValue();

		//If the text has changed, confirm before allowing it to close
		if (text !== editor.originalValue) {
			if (confirm('Quit without saving?') === false) {
				//Requested the close action be cancelled.
				e.preventDfault();
				e.cancel();
				return false;
			}
		}

		//Clear out the content
		editor.getSession().setValue('');

		//Cancel the function that warns before being allowed to close the browser
		window.onbeforeunload = null;

	});
}

function warnBeforeClosing() {
	return 'It looks like you have been editing something -- if you leave before submitting your changes will be lost.'
}

/**
 * Set a custom function to display error messages.
 * @param {type} message
 * @returns {undefined}
 */
tvExplorer.errorDisplay = function(message, data) {
	debugLog("A custom function that reports the error", message);
	debugLog("Error payload", data);
}

tvExplorer.apiRequest.BeforeSend = function(jqXHR, settings) {
	debugLog('tvExplorer.apiRequest.BeforeSend jqXHR', jqXHR);
	debugLog('tvExplorer.apiRequest.BeforeSend settings', settings);
};

tvExplorer.apiRequest.Always = function() {
	debugLog('tvExplorer.apiRequest.Always', 'Just executed.');
};

/**
 * Load the select vault dropdown
 * 
 * @param {type} data The data from a successful apiRequest.send
 * @returns {undefined}
 */
function loadVaultDropdown(data) {
	debugLog('Vaults dropdown response', data);
	//Reset the vault dropdown by removing all but the first "Select a vault" option.
	jQuery("#select-vault option").each(function(index) {
		if (index > 0) {
			jQuery(this).remove();
		}
	});

	//Reset the schema dropdown by removing all but the first "Select a schema" option.
	jQuery("#select-schema option").each(function(index) {
		if (index > 0) {
			jQuery(this).remove();
		}
	});

	//Loop through the results and add the new vault results.
	for (var i = 0; i < data.vaults.length; i++) {
		debugLog('Vault details', data.vaults[i]);

		//Add the vault to the select dropdown.
		jQuery('#select-vault').append(jQuery("<option/>", {
			value: data.vaults[i].id,
			text: data.vaults[i].name
		}));
	}
	//Get the editor 
	var editor = ace.edit('ace-editor');

	if (jQuery('#modal-create-document').data('type') === 'schema') {
		//Hide the select-schema if we're creating a schema
		jQuery('#select-schema').css('display', 'none');

		//Create a schema template to work with.
		var defaultSchema = {
			fields: [
				{
					index: true,
					type: "string",
					name: "field-name1"
				},
				{
					index: true,
					type: "integer",
					name: "field-name2"
				}
			],
			name: "new-schema-name"
		};
		
		//Make it a nicely formatted string to use in the edtior
		var defaultSchemaText = JSON.stringify(defaultSchema, null, '\t');

		editor.originalValue = defaultSchemaText;
		editor.getSession().setValue(defaultSchemaText);
		
	} else {
		//Set the originalValue as empty because that's what we're starting with.
		//Set this before clearing out the document information so the change
		//event will fire and see it matches the originalValue.
		editor.originalValue = '';

		//Clear out the document value since it's a new document.
		editor.getSession().setValue('');

	}

	//Move the vault and schema selections to the modal
	jQuery('.storage-options').detach().prependTo('#modal-create-document .modal-body');

	//Make sure the needed options are visible
	jQuery('.storage-options').css('display', 'block');

	//Move the editor to the modal
	jQuery('#ace-editor-frame').detach().appendTo('#modal-create-document .modal-body');
	jQuery('#ace-editor-frame').css('display', 'block');

	//Put the right style color on the close button
	if (jQuery('#modal-create-document .btn.cancel').hasClass('btn-danger')) {
		jQuery('#modal-create-document .btn.cancel').removeClass('btn-danger');
		jQuery('#modal-create-document .btn.cancel').addClass('btn-warning');
	}

	//Open the modal popup for creating the docuemnt
	jQuery('#modal-create-document').modal();
}



/**
 * Track changes to the vault selection dropdown 
 * and load a new schema each time it's changed.
 */
jQuery('#select-vault').change(function() {
	debugLog('Select vault option changed', 'New value: ' + jQuery(this).html() + ' (' + jQuery(this).val() + ')');

	if (jQuery(this).val() !== '') {
		//Load the schema for this vault
		var vaultId = jQuery(this).val();
		var vaultName = jQuery(this).html();

		debugLog('Schema search for dropdown', 'Looking for schemas in vault: ' + vaultName + ' (' + vaultId + ')');

		/**
		 * Execute the function to find all schemas within the vault based on the value of the option selected.
		 */
		tvExplorer.schemas.findAll(vaultId, loadSchemaDropdown);

	}
});

/**
 * The callback function that'll be used to
 * show schema information based on the apiRequest response.
 * 
 * @param {type} data The data from a successful apiRequest
 * @returns {undefined}
 */
function loadSchemaDropdown(data) {
	debugLog('Schema dropdown response', data);

	//Reset the dropdown by removing all but the first "Select a schema" option.
	jQuery("#select-schema option").each(function(index) {
		if (index > 0) {
			jQuery(this).remove();
		}
	});

	//Add each of the schemas to the dropdown
	for (var i = 0; i < data.schemas.length; i++) {
		debugLog('Schema found', data.schemas[i].name);

		//Add the vault to the select dropdown.
		jQuery('#select-schema').append(jQuery("<option/>", {
			value: data.schemas[i].id,
			text: data.schemas[i].name
		}));
	}


}

/**
 * Create a function that'll be used as a callback to 
 * show vault information based on the apiRequest.send response.
 * 
 * @param {type} data The data from a successful apiRequest.send
 * @returns {undefined}
 */
function displayAllVaults(data) {
	debugLog('Vaults found', data);
	//Reset the vault dropdown by removing all but the first "Select a vault" option.
	jQuery("#select-vault option").each(function(index) {
		if (index > 0) {
			jQuery(this).remove();
		}
	});

	//Clear the list of vaults
	jQuery('.vaults .content').html('');

	//Loop through the results and add the new vault results.
	for (var i = 0; i < data.vaults.length; i++) {
		debugLog('Vault details', data.vaults[i]);
		jQuery('.vaults .content').append("<a href='#' class='vault' data-id='" + data.vaults[i].id + "'><span class='glyphicon glyphicon-hdd'></span> " + data.vaults[i].name + "</a>");

		//Add the vault to the select dropdown.
		jQuery('#select-vault').append(jQuery("<option/>", {
			value: data.vaults[i].id,
			text: data.vaults[i].name
		}));
	}
}



/**
 * A function to set API values to make requests with.
 * Uses the input fields from the HTML page. These values shouldn't be
 * hard coded in your program. Use an AJAX request from your server to 
 * get them when writing your production code.
 */
function setApiValues() {
	//Get the API/Account details from the page input fields.
	tvExplorer.apiKey = jQuery('#api-key').val();
	tvExplorer.accountId = jQuery('#account-id').val();

	//Clear out any spaces that could come in from copy/pasting
	tvExplorer.apiKey = tvExplorer.apiKey.replace(/\s/g, '');
	tvExplorer.accountId = tvExplorer.accountId.replace(/\s/g, '');

	jQuery('#api-key').val(tvExplorer.apiKey);
	jQuery('#account-id').val(tvExplorer.accountId);

	//Save the information into session cookies so we don't have
	//to keep entering the values in over and over.
	//By not including a path for the cookie, we lock
	//access to the cookies to this page only.
	//By not including an expiration date, we make it
	//a session cookie that's deleted when the browser is closed.
	if (jQuery('#save-api-details').is(':checked')) {
		jQuery.cookie('api-key', tvExplorer.apiKey);
		jQuery.cookie('account-id', tvExplorer.accountId);
	} else {
		jQuery.cookie('api-key', '');
		jQuery.cookie('account-id', '');
	}

	//Always save the checkbox setting so the user won't have to keep turning it off.
	//This can be saved beyond the session (1 year/365 days).
	jQuery.cookie('save-api-details', jQuery('#save-api-details').is(':checked'), {expires: 365});
}

/**
 * Does a basic check to make sure we actually have
 * some values set for the API. 
 * 
 * @returns {Boolean} Are values set?
 */
function checkApiValues() {
	//default to a successful response.
	var response = true;

	//Do basic testing to make sure we have some kind of values
	if (tvExplorer.api === '') {
		//alert to the error and set a failed response.
		alert('Missing TrueVault API key');
		response = false;
	}
	if (tvExplorer.accountId === '') {
		//alert to the error and set a failed response.
		alert('Missing TrueVault Account ID');
		response = false;
	}

	return response;

}

/**
 * The callback function that'll be used to
 * show schema information based on the apiRequest response.
 * 
 * @param {type} data The data from a successful apiRequest
 * @param {type} vaultId The Id of the parent vault
 * @returns {undefined}
 */
function displayAllSchemas(data, vaultId) {
	debugLog('Schema search response', data);

	for (var i = 0; i < data.schemas.length; i++) {
		debugLog('Schema found', data.schemas[i].name);

		//Add HTML for each schema that allows for more details when the displaySchemaDetails callback executes
		jQuery('.schemas .content').append("<div class='schema' id='schema-" + data.schemas[i].id + "' data-id='" + data.schemas[i].id + "' data-vault-id='" + vaultId + "'><div><a href='#' class='title'><span class='glyphicon glyphicon-book'></span> " + data.schemas[i].name + "</a></div><div class='details'></div></div>");

		//lookup the schemda details
		tvExplorer.schemas.get(vaultId, data.schemas[i].id, displaySchemaDetails);
	}
}

function displaySchemaDetails(data) {
	debugLog('Schema details', data);

	//Add the informaiton to the schema's details
	//but make sure it's a successful request before trying.
	if (data.result === "success") {
		//We know which schema we're working with because the ID of 
		//the HTML has been set to include the schema id
		jQuery('#schema-' + data.schema.id + ' .details').html(jsonHelper.prettyPrint(data.schema));
	}
}

/**
 * Get all schemas and the list of documents within a vault when a .vault link is clicked.
 * Use "on", instead of "click" so it'll bind to newly created elements.
 */
jQuery('.vaults .content').on('click', 'a.vault', function() {
	var vaultId = jQuery(this).data('id');
	var vaultName = jQuery(this).html();


	//Clear out the list of schemas and documents if this is the first page
	jQuery('.schemas .content').html("");
	jQuery('.documents .content').html("");

	debugLog('Schema search', 'Looking for schemas in vault: ' + vaultName + ' (' + vaultId + ')');

	/**
	 * Execute the function to find all schemas within the vault based on the id within the link clicked.
	 * Wrap displayAllSchemas in an anonymous callback function so we can pass the vaultId as well as 
	 * accept data from the API response.
	 */
	tvExplorer.schemas.findAll(jQuery(this).data('id'), function(data) {
		displayAllSchemas(data, vaultId);
	});

	debugLog('Documents search all', 'Looking for all documents within vault: ' + vaultName + ' (' + vaultId + ')');
	/**
	 * Execute the function to find all documents within the vault based on the vault id within the link clicked.
	 * Wrap displayAllDocuments in an anonymous callback function so we can pass the vaultId as well as 
	 * accept data from the API response.
	 * 
	 * Request the first page. The callback will request any additional pages.
	 */
	tvExplorer.documents.findAll(vaultId, 1, function(data) {
		displayAllDocuments(data, vaultId)
	});


	//return false so the page doesn't scroll to the top (href='#')
	return false;
});




/**
 * The callback function that'll be used to
 * show all documents within a vault.
 * 
 * @param {type} data The data from a successful apiRequest
 * @param {type} vaultId The Id of the parent vault
 * @returns {undefined}
 */
function displayAllDocuments(data, vaultId) {
	//Note: the json returned has a parent node named "data".
	//So, when we're looking up the information, we're using the
	//passed parameter data to lookup the node data.
	debugLog('All documents', data);

	//Make sure it's a successful request before working with the result.
	if (data.result === "success") {
		//Find out how many pages of documents are available
		//by dividing the total (number of documents) by per_page.
		var num_pages = Math.ceil(data.data.total / data.data.per_page);

		var documentId = "";
		var schemaId = "";
		var schemaHtml = "";

		for (var i = 0; i < data.data.items.length; i++) {
			documentId = data.data.items[i].id;

			if (data.data.items[i].schema_id === "null") {
				schemaId = "";
				schemaHtml = "";
			} else {
				schemaId = data.data.items[i].schema_id;
				//Get the schema HTML from the list of schemas that we already 
				//pulled and put into the link.
				schemaHtml = jQuery("#schema-" + schemaId + " a").html();
			}


			//Add HTML for each document that allows for more details if it's been requested.
			//This could probably be handled nicer with some kind of templating and mustache. 
			//If you agree, please make the changes and contribute them to the project =D
			jQuery('.documents .content').append("<div class='document' data-vault-id='" + vaultId + "' data-schema-id='" + schemaId + "' data-document-id='" + documentId + "' id='document-" + documentId + "'>\n\
<div><a class='title' href='#'><span class='glyphicon glyphicon-file'></span> " + documentId + "</a></div>\n\
<div class='options'><a class='delete' href='#'><span class='glyphicon glyphicon-trash'></span> Delete</a> <span class='schema-info'>" + schemaHtml + "</span> </div>\n\
<div class='details'></div>\n\
</div>");
		}

		//Do we need to get another page of data?
		if (num_pages > data.data.page) {
			//Hard code a page limit just in case someone has a really large vault.
			//I hate to hard code vaules like this but we'll throw out a message to alert the issue.
			if (data.data.page === 5) {
				alert('Hard coded page limit of 5 reached. Look for this code and remove it to release the limit.');
			} else {
				//poll the next page (data.data.info.current_page + 1)
				tvExplorer.documents.findAll(vaultId, (data.data.info.current_page + 1), function(data) {
					displayAllDocuments(data, vaultId)
				});
			}

		}

	}

}

/**
 * Get the contents of a document when a .title link is clicked.
 * Use "on", instead of "click" so it'll bind to newly created elements.
 */
jQuery('.documents .content').on('click', 'a.title', function() {
	var documentId = jQuery(this).closest('.document').data('documentId');
	var vaultId = jQuery(this).closest('.document').data('vaultId');

	debugLog('Document contents', 'Getting the contents of document: ' + documentId + ' from vault: ' + vaultId);

	/**
	 * Execute the function to get the document within the vault based on the id within the link clicked.
	 * Wrap displayDocument in an anonymous callback function so we can pass the documentId as well as 
	 * accept data from the API response.
	 */
	tvExplorer.documents.get(vaultId, documentId, function(data) {
		displayDocument(data, vaultId, documentId);
	});

	//return false so the page doesn't scroll to the top (href='#')
	return false;
});

/**
 * Handles the display of a document. Shows the contents as
 * modal or inline, depending on the switch.
 * @param {string} data The data from the apiRequest. It should be base64 encoded.
 * @param {string} documentId The Id of the document requested.
 * @param {string} vaultId The Id of the vault that stores the document.
 * @returns {undefined}
 */
function displayDocument(data, vaultId, documentId) {
	debugLog('Document contents received', data);

	//The data comes back as application/octet-stream and base64 encoded.
	fileContent = atob(data);

	//Assume JSON until I write other code to handle different files.
	//fileJson = jQuery.parseJSON(fileContent);

	//Should this be displayed in the modal editor or inline withing the file list?
	if (jQuery('#display-in-editor').is(':checked')) {
		var schemaId = jQuery('#document-' + documentId).data("schemaId");

		var editor = ace.edit('ace-editor');

		//Set the originalValue so it could be tested against for changes.
		//Set this before clearing out the document information so the change
		//event will fire and see it matches the originalValue.
		editor.originalValue = fileContent;

		//set the content in the editor
		editor.getSession().setValue(fileContent);


		//Move the editor to the modal
		jQuery('#ace-editor-frame').detach().appendTo('#modal-edit-document .modal-body');
		jQuery('#ace-editor-frame').css('display', 'block');

		jQuery('#modal-edit-document .modal-title').text(documentId);

		//Set the details for the document
		jQuery('#modal-edit-document').data('documentId', documentId);
		jQuery('#modal-edit-document').data('mode', 'edit');
		jQuery('#modal-edit-document').data('type', 'document');

		//Move the vault and schema selections to the modal
		jQuery('.storage-options').detach().prependTo('#modal-edit-document .modal-body');

		//Make sure the options are visible
		jQuery('.storage-options').css('display', 'block');
		//Show the schema because it could be hidden sometimes.
		jQuery('#select-schema').css('display', 'block');


		//Preselect the vault for this document
		jQuery('#select-vault').val(vaultId)

		//Trigger a selection change so the schema list will be populated
		jQuery('#select-vault').change();

		//Preselect the schema for this document
		jQuery('#select-schema').val(schemaId)

		//Put the right style color on the close button
		if (jQuery('#modal-edit-document .btn.cancel').hasClass('btn-danger')) {
			jQuery('#modal-edit-document .btn.cancel').removeClass('btn-danger');
			jQuery('#modal-edit-document .btn.cancel').addClass('btn-warning');
		}

		jQuery('#modal-edit-document').modal();
	} else {
		fileHtml = jsonHelper.prettyPrint(jQuery.parseJSON(fileContent));
		jQuery('#document-' + documentId + ' .details').html(fileHtml);
	}
}





/**
 * Get the contents of a schema when a .title link is clicked.
 * Use "on", instead of "click" so it'll bind to newly created elements.
 */
jQuery('.schemas .content').on('click', 'a.title', function() {
	//Get the details from the parent div
	var schemaId = jQuery(this).closest('.schema').data('id');
	var vaultId = jQuery(this).closest('.schema').data('vaultId');

	debugLog('Schema contents', 'Getting the contents of schema: ' + schemaId + ' from vault: ' + vaultId);

	/**
	 * Execute the function to get the schema within the vault based on the id within the link clicked.
	 * Wrap displaySchema in an anonymous callback function so we can pass the documentId as well as 
	 * accept data from the API response.
	 */
	tvExplorer.schemas.get(vaultId, schemaId, displaySchema);

	//return false so the page doesn't scroll to the top (href='#')
	return false;
});

/**
 * Handles the display of a document. Shows the contents as
 * modal or inline, depending on the switch.
 * @param {string} data The data from the apiRequest. It should be base64 encoded.
 * @returns {undefined}
 */
function displaySchema(data) {
	debugLog('Schema contents received', data);

	var schemaId = data.schema.id;
	var vaultId = data.schema.vault_id;


	var editor = ace.edit('ace-editor');

	//Since the schema is not a document but actual data,
	//we'll need to build the string to edit.
	var schemaToUpdate = {
		"fields": data.schema.fields,
		"name": data.schema.name
	};

	//Make the JSON into nicely formatted text 
	schemaFieldsFormatted = JSON.stringify(schemaToUpdate, null, '\t');

	//Set the originalValue so it could be tested against for changes.
	//Set this before clearing out the document information so the change
	//event will fire and see it matches the originalValue.
	editor.originalValue = schemaFieldsFormatted;

	//set the content in the editor
	editor.getSession().setValue(schemaFieldsFormatted);


	//Move the editor to the modal
	jQuery('#ace-editor-frame').detach().appendTo('#modal-edit-document .modal-body');
	jQuery('#ace-editor-frame').css('display', 'block');

	jQuery('#modal-edit-document .modal-title').text(data.schema.name);

	//Set the details for the editor so we'll know how to handle a save request.
	jQuery('#modal-edit-document').data('vaultId', vaultId);
	jQuery('#modal-edit-document').data('schemaId', schemaId);
	jQuery('#modal-edit-document').data('mode', 'edit');
	jQuery('#modal-edit-document').data('type', 'schema');

	//Move the vault and schema selections to the modal
	jQuery('.storage-options').detach().prependTo('#modal-edit-document .modal-body');

	//Put the right style color on the close button
	if (jQuery('#modal-edit-document .btn.cancel').hasClass('btn-danger')) {
		jQuery('#modal-edit-document .btn.cancel').removeClass('btn-danger');
		jQuery('#modal-edit-document .btn.cancel').addClass('btn-warning');
	}

	jQuery('#modal-edit-document').modal();
}







/**
 * Save the contents of an edited document
 */
jQuery('#modal-edit-document .btn.save').click(function() {
	//Find out what type of object we're trying to save
	if (jQuery('#modal-edit-document').data('type') === 'schema') {
		//Get the details
		var schemaContent = ace.edit('ace-editor').getValue();

		//This is an update so we have to get some settings.
		//We're not going to allow selecting of a different vault
		//so the vaultId is stored in the data attribute.
		var vaultId = jQuery('#modal-edit-document').data('vaultId');
		var schemaId = jQuery('#modal-edit-document').data('schemaId');

		/**
		 * Execute the function to update the document within the vault based on the details within the modal.
		 * Wrap updateDocument in an anonymous callback function so we can pass the documentId as well as 
		 * accept data from the API response.
		 */
		tvExplorer.schemas.update(vaultId, schemaId, schemaContent, updateSchema);


	} else if (jQuery('#modal-edit-document').data('type') === 'document') {
		//Get the details
		var vaultId = jQuery('#select-vault').val();
		var schemaId = jQuery('#select-schema').val();
		var documentContent = ace.edit('ace-editor').getValue();

		//This is an update so we have the documentId to update
		var documentId = jQuery('#modal-edit-document').data('documentId');

		//Make sure a vault was selected
		if (vaultId === '') {
			alert('Select a vault before saving.');
		} else {
			/**
			 * Execute the function to update the document within the vault based on the details within the modal.
			 * Wrap updateDocument in an anonymous callback function so we can pass the documentId as well as 
			 * accept data from the API response.
			 */
			tvExplorer.documents.update(vaultId, schemaId, documentContent, documentId, function(data) {
				updateDocument(data, documentId);
			});

		}

	}


});


/**
 * Handles the update response of a document.
 * @param {string} data The data from the apiRequest.
 * @returns {undefined}
 */
function updateSchema(data) {
	debugLog('Schema updated', data);

	//Reset the editor text so it won't warn on close.
	var editor = ace.edit('ace-editor');
	editor.originalValue = '';
	editor.getSession().setValue('');

	//Close the modal
	jQuery('#modal-edit-document').modal('hide');
}



/**
 * Save the contents of a new document
 */
jQuery('#modal-create-document .btn.save').click(function() {
	if (jQuery('#modal-create-document').data('type') === 'schema') {
		//Get the details
		var vaultId = jQuery('#select-vault').val();
		var schemaContent = ace.edit('ace-editor').getValue();

		//Make sure a vault was selected
		if (vaultId === '') {
			alert('Select a vault before saving.');
		} else {
			tvExplorer.schemas.create(vaultId, schemaContent, createSchema);
		}

	} else if (jQuery('#modal-create-document').data('type') === 'document') {
		//Get the details
		var vaultId = jQuery('#select-vault').val();
		var schemaId = jQuery('#select-schema').val();
		var documentContent = ace.edit('ace-editor').getValue();

		//Make sure a vault was selected
		if (vaultId === '') {
			alert('Select a vault before saving.');
		} else {
			tvExplorer.documents.create(vaultId, schemaId, documentContent, createDocument);
		}

	}
});

/**
 * Format the contents of a document
 */
jQuery('.modal .btn.format').click(function() {
	//Get the editor
	var editor = ace.edit('ace-editor');
	//Get the content
	var documentContents = editor.getValue();

	//Create a JSON object so the stringify function can format it.
	var documentJson = jQuery.parseJSON(documentContents);

	//Format the content
	var documentFormatted = JSON.stringify(documentJson, null, '\t');

	//Set the formatted content
	editor.getSession().setValue(documentFormatted);

	return false;
});


/**
 * Handles the update response of a document.
 * @param {string} data The data from the apiRequest.
 * @param {string} documentId The Id of the document deleted.
 * @returns {undefined}
 */
function updateDocument(data, documentId) {
	debugLog('Document updated', data);

	//Reset the editor text so it won't warn on close.
	var editor = ace.edit('ace-editor');
	editor.originalValue = '';
	editor.getSession().setValue('');

	//Close the modal
	jQuery('#modal-edit-document').modal('hide');
}

/**
 * Handles the response of a new document
 * @param {type} data
 * @returns {undefined}
 */
function createDocument(data) {
	debugLog('Document created', data);

	//Reset the editor text so it won't warn on close.
	var editor = ace.edit('ace-editor');
	editor.originalValue = '';
	editor.getSession().setValue('');

	//Close the modal
	jQuery('#modal-create-document').modal('hide');
}

/**
 * Handles the response of a new schema
 * @param {type} data
 * @returns {undefined}
 */
function createSchema(data) {
	debugLog('Schema created', data);

	//Reset the editor text so it won't warn on close.
	var editor = ace.edit('ace-editor');
	editor.originalValue = '';
	editor.getSession().setValue('');

	//Close the modal
	jQuery('#modal-create-document').modal('hide');
}


/**
 * Get the contents of a document when a .title link is clicked.
 * Use "on", instead of "click" so it'll bind to newly created elements.
 */
jQuery('.documents .content').on('click', 'a.delete', function() {
	var documentId = jQuery(this).closest('.document').data('documentId');
	var vaultId = jQuery(this).closest('.document').data('vaultId');

	debugLog('Document delete', 'Requesting confirmation to deleting the document: ' + documentId + ' from vault: ' + vaultId);
	if (confirm("Are you sure you'd like to delete this file?\n" + documentId)) {
		debugLog('Document delete', 'Confirmed deleting the document: ' + documentId + ' from vault: ' + vaultId);

		/**
		 * Execute the function to delete the document within the vault based on the id of the link clicked.
		 * Wrap deleteDocument in an anonymous callback function so we can pass the documentId as well as 
		 * accept data from the API response.
		 */
		tvExplorer.documents.delete(vaultId, documentId, function(data) {
			deleteDocument(data, documentId);
		});
	} else {
		debugLog('Document delete rejected', 'Aborting delete');
	}


	//return false so the page doesn't scroll to the top (href='#')
	return false;
});
/**
 * Handles the deletion of a document.
 * @param {string} data The data from the apiRequest.
 * @param {string} documentId The Id of the document deleted.
 * @returns {undefined}
 */
function deleteDocument(data, documentId) {
	debugLog('Document deleted', data);

	//Remove it from the list
	jQuery('#document-' + documentId).remove();
}


/**
 * Display debug information by adding it to the console.log and page log area.
 * 
 * @param {string} title A descriptive title to the information being displayed.
 * @param {object} message A string message or JSON object to display.
 * @returns {undefined}
 */
function debugLog(title, message) {
	console.log(message);

	//make it easier to read JSON by making the information into a string.
	if ((typeof message) === "object") {
		messageHtml = jsonHelper.prettyPrint(message);
	} else {
		messageHtml = message;
	}

	//Add the information to the page log.
	jQuery('.logs .content').append("<div class='item'><div class='title'>" + title + "</div><div class='type'>Type: " + (typeof message) + "</div><div class='message'>" + messageHtml + "</div></div>");

	//Scroll to the bottom of the page log.
	jQuery('.logs .content').scrollTop(jQuery('.logs .content')[0].scrollHeight);
}


/**
 * Helps make JSON easier to read when showing it on the page.
 * credit http://jsfiddle.net/unLSJ/
 * @type type
 */
jsonHelper = {
	replacer: function(match, pIndent, pKey, pVal, pEnd) {
		var key = '<span class="json-key">';
		var val = '<span class="json-value">';
		var str = '<span class="json-string">';
		var r = pIndent || '';
		if (pKey)
			r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
		if (pVal)
			r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
		return r + (pEnd || '');
	},
	prettyPrint: function(obj) {
		var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
		return "<pre class='json'>" + JSON.stringify(obj, null, 3)
				.replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
				.replace(/</g, '&lt;').replace(/>/g, '&gt;')
				.replace(jsonLine, jsonHelper.replacer) + "</pre>";
	}
};