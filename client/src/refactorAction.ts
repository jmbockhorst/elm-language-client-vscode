import { commands, window, ExtensionContext } from "vscode";
import { LanguageClient, CodeActionParams } from 'vscode-languageclient';
import { GetMoveDestinationRequest, MoveRequest } from './protocol';

export function registerCommands(languageClient: LanguageClient, context: ExtensionContext) {
	context.subscriptions.push(commands.registerCommand('elm.refactor', async (command: string, params: any, commandInfo: any) => {
		if (command === 'moveFunction') {
			await moveFunction(languageClient, params, commandInfo);
		}
	}));
}

async function moveFunction(languageClient: LanguageClient, params: CodeActionParams, commandInfo: any) {
	const moveDestinations = await languageClient.sendRequest(GetMoveDestinationRequest, {
		sourceUri: params.textDocument.uri,
		params
	});

	if (!moveDestinations || !moveDestinations.destinations || !moveDestinations.destinations.length) {
		window.showErrorMessage("Cannot find possible file targets to move the selected method to.");
		return;
	}

	const destinationNodeItems = moveDestinations.destinations.map((destination) => {
		return {
			label: `${destination.type} ${destination.name}`,
			description: destination.isField ? "Field" : "Function Parameter",
			destination,
		};
	});

	const functionName = commandInfo && commandInfo.displayName ? commandInfo.displayName : '';
	const selected = await window.showQuickPick(destinationNodeItems, {
		placeHolder: `Select the new file for the function ${functionName}.`,
	});

	if (!selected) {
		return;
	}

	await languageClient.sendRequest(MoveRequest, {
		sourceUri: params.textDocument.uri,
		params,
		destination: selected.destination,
	});
}