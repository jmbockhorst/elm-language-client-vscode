import { commands, window, ExtensionContext } from "vscode";
import { LanguageClient, CodeActionParams } from "vscode-languageclient";
import { GetMoveDestinationRequest, MoveRequest } from "./protocol";

export function registerCommands(
  languageClient: LanguageClient,
  context: ExtensionContext,
) {
  context.subscriptions.push(
    commands.registerCommand(
      "elm.refactor",
      async (command: string, params: any, name: string, type: string) => {
        if (command === "move") {
          await move(languageClient, params, name, type);
        }
      },
    ),
  );
}

async function move(
  languageClient: LanguageClient,
  params: CodeActionParams,
  name: string,
  type: string,
) {
  const moveDestinations = await languageClient.sendRequest(
    GetMoveDestinationRequest,
    {
      sourceUri: params.textDocument.uri,
      params,
    },
  );

  if (
    !moveDestinations ||
    !moveDestinations.destinations ||
    !moveDestinations.destinations.length
  ) {
    window.showErrorMessage(
      `Cannot find possible file targets to move the selected ${type} to.`,
    );
    return;
  }

  const destinationNodeItems = moveDestinations.destinations.map(
    destination => {
      return {
        label: destination.name,
        description: destination.path,
        destination,
      };
    },
  );

  const selected = await window.showQuickPick(destinationNodeItems, {
    placeHolder: `Select the new file for the ${type} ${name}.`,
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
