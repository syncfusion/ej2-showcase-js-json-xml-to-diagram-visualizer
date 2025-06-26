// Helper for EJ2 JavaScript Diagram component to parse JSON into nodes and connectors

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;

class JsonDiagramParser {
    /**
     * Processes input JSON object and returns diagram data.
     * @param {Object} inputJsonData - Parsed JSON object
     * @returns {{ nodes: Object[], connectors: Object[] }}
     */
    static processData(inputJsonData) {
        const parsedDiagramData = { nodes: [], connectors: [] };
        
        if (!JsonDiagramParser.isValidJsonData(inputJsonData)) {
            return parsedDiagramData;
        }

        const processedData = JsonDiagramParser.preprocessJsonData(inputJsonData);
        const { processedJson, rootNodeIdentifier, shouldSkipEmptyRoot } = processedData;
        
        const categorizedKeys = JsonDiagramParser.categorizeObjectKeys(processedJson);
        const { nestedObjectKeys, primitiveValueKeys } = categorizedKeys;

        const isRootNodeCreated = JsonDiagramParser.processRootNode(
            processedJson, 
            primitiveValueKeys, 
            rootNodeIdentifier, 
            shouldSkipEmptyRoot, 
            parsedDiagramData
        );

        JsonDiagramParser.processNestedObjectKeys(
            processedJson,
            nestedObjectKeys,
            rootNodeIdentifier,
            isRootNodeCreated,
            parsedDiagramData
        );

        JsonDiagramParser.handleMultipleRootNodes(parsedDiagramData, shouldSkipEmptyRoot, isRootNodeCreated);

        return parsedDiagramData;
    }

    // Validate if the input JSON data is valid for processing
    static isValidJsonData(inputJsonData) {
        return inputJsonData && 
               typeof inputJsonData === 'object' && 
               !Array.isArray(inputJsonData) && 
               Object.keys(inputJsonData).length > 0;
    }

    // Preprocess JSON data to handle single root key scenarios
    static preprocessJsonData(inputJsonData) {
        let rootNodeIdentifier = 'root';
        let processedJson = inputJsonData;
        let shouldSkipEmptyRoot = false;

        const jsonObjectKeys = Object.keys(inputJsonData);
        
        if (jsonObjectKeys.length === 1) {
            const singleRootKey = jsonObjectKeys[0];
            const rootValue = inputJsonData[singleRootKey];
            
            if (JsonDiagramParser.isEmptyOrWhitespace(singleRootKey) && rootValue && typeof rootValue === 'object') {
                shouldSkipEmptyRoot = true;
                processedJson = rootValue;
            } else if (!JsonDiagramParser.isEmptyOrWhitespace(singleRootKey) && rootValue && typeof rootValue === 'object') {
                rootNodeIdentifier = singleRootKey;
            }
        }

        return { processedJson, rootNodeIdentifier, shouldSkipEmptyRoot };
    }

    // Categorize object keys into primitive and nested object properties
    static categorizeObjectKeys(jsonData) {
        const nestedObjectKeys = [];
        const primitiveValueKeys = [];
        
        Object.keys(jsonData).forEach(keyName => {
            const keyValue = jsonData[keyName];
            if (keyValue !== null && typeof keyValue === 'object') {
                nestedObjectKeys.push(keyName);
            } else {
                primitiveValueKeys.push(keyName);
            }
        });

        return { nestedObjectKeys, primitiveValueKeys };
    }

    // Process root node creation for primitive properties
    static processRootNode(jsonData, primitiveValueKeys, rootNodeIdentifier, shouldSkipEmptyRoot, parsedDiagramData) {
        if (primitiveValueKeys.length === 0) {
            return false;
        }

        const finalRootId = shouldSkipEmptyRoot ? 'data-root' : JsonDiagramParser.convertUnderScoreToPascalCase(rootNodeIdentifier);
        const primitiveLeafAnnotations = JsonDiagramParser.createPrimitiveAnnotations(jsonData, primitiveValueKeys);
        const combinedPrimitiveContent = JsonDiagramParser.createCombinedPrimitiveContent(jsonData, primitiveValueKeys);

        const rootLeafNode = {
            id: finalRootId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: primitiveLeafAnnotations,
            additionalInfo: { isLeaf: true },
            data: {
                path: 'Root',
                title: combinedPrimitiveContent,
                actualdata: combinedPrimitiveContent
            }
        };
        
        parsedDiagramData.nodes.push(rootLeafNode);
        return true;
    }

    // Create annotations for primitive key-value pairs
    static createPrimitiveAnnotations(jsonData, primitiveKeys) {
        return primitiveKeys.flatMap(keyName => {
            const formattedValue = jsonData[keyName] == null ? '' : String(jsonData[keyName]);
            const keyValueAnnotations = [{
                id: `Key_${keyName}`,
                content: `${keyName}:`
            }];
            keyValueAnnotations.push({
                id: `Value_${keyName}`,
                content: formattedValue
            });
            return keyValueAnnotations;
        });
    }

    // Create combined content string for primitive properties
    static createCombinedPrimitiveContent(jsonData, primitiveKeys) {
        return primitiveKeys
            .map(keyName => `${keyName}: ${jsonData[keyName]}`)
            .join('\n');
    }

    // Process nested object keys and create their nodes
    static processNestedObjectKeys(jsonData, nestedObjectKeys, rootNodeIdentifier, isRootNodeCreated, parsedDiagramData) {
        nestedObjectKeys.forEach(nestedKeyName => {
            if (JsonDiagramParser.isEmpty(jsonData[nestedKeyName])) return;
            
            const nestedNodeId = JsonDiagramParser.createNestedObjectNode(jsonData, nestedKeyName, parsedDiagramData);
            
            if (isRootNodeCreated) {
                JsonDiagramParser.createConnector(rootNodeIdentifier, nestedNodeId, parsedDiagramData);
            }

            JsonDiagramParser.processNestedData(
                jsonData[nestedKeyName],
                nestedNodeId,
                parsedDiagramData.nodes,
                parsedDiagramData.connectors,
                `Root.${nestedKeyName}`,
                nestedKeyName
            );
        });
    }

    // Create a nested object node and return its ID
    static createNestedObjectNode(jsonData, nestedKeyName, parsedDiagramData) {
        const nestedNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(nestedKeyName);
        const nestedChildCount = JsonDiagramParser.getObjectLength(jsonData[nestedKeyName]);
        const nestedNodeAnnotations = [{ content: nestedKeyName }];
        
        if (nestedChildCount > 0) {
            nestedNodeAnnotations.push({ content: `{${nestedChildCount}}` });
        }

        const nestedObjectNode = {
            id: nestedNodeId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: nestedNodeAnnotations,
            additionalInfo: { isLeaf: false, mergedContent: `${nestedKeyName} {${nestedChildCount}}` },
            data: {
                path: `Root.${nestedKeyName}`,
                title: nestedKeyName,
                actualdata: nestedKeyName,
                displayContent: { key: [nestedKeyName], displayValue: nestedChildCount }
            }
        };
        
        parsedDiagramData.nodes.push(nestedObjectNode);
        return nestedNodeId;
    }

    // Create a connector between two nodes
    static createConnector(sourceId, targetId, parsedDiagramData) {
        parsedDiagramData.connectors.push({
            id: `connector-${sourceId}-${targetId}`,
            sourceID: sourceId,
            targetID: targetId
        });
    }

    // Handle multiple root nodes scenario
    static handleMultipleRootNodes(parsedDiagramData, shouldSkipEmptyRoot, isRootNodeCreated) {
        const hasMultipleRoots = JsonDiagramParser.hasMultipleRoots(parsedDiagramData.nodes, parsedDiagramData.connectors);
        
        if ((shouldSkipEmptyRoot || hasMultipleRoots) && !isRootNodeCreated) {
            JsonDiagramParser.checkMultiRoot(parsedDiagramData.nodes, parsedDiagramData.connectors);
        }
    }

    // Recursively processes nested objects/arrays
    static processNestedData(nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        if (!nestedElement || typeof nestedElement !== 'object') return;

        if (Array.isArray(nestedElement)) {
            JsonDiagramParser.processArrayElements(nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath, parentKeyName);
            return;
        }

        JsonDiagramParser.processObjectElements(nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath);
    }

    // Process array elements and create corresponding nodes
    static processArrayElements(arrayElement, parentNodeId, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        arrayElement.forEach((arrayItem, arrayIndex) => {
            if (arrayItem == null) return;
            
            const arrayItemNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(`${parentNodeId}-${arrayIndex}`);
            
            if (JsonDiagramParser.isComplexArrayItem(arrayItem)) {
                JsonDiagramParser.processComplexArrayItem(
                    arrayItem,
                    arrayItemNodeId,
                    parentNodeId,
                    arrayIndex,
                    diagramNodes,
                    diagramConnectors,
                    currentPath,
                    parentKeyName
                );
            } else {
                JsonDiagramParser.processPrimitiveArrayItem(
                    arrayItem,
                    arrayItemNodeId,
                    parentNodeId,
                    arrayIndex,
                    diagramNodes,
                    diagramConnectors,
                    currentPath,
                    parentKeyName
                );
            }
        });
    }

    // Check if array item is a complex object
    static isComplexArrayItem(arrayItem) {
        return arrayItem && typeof arrayItem === 'object' && !Array.isArray(arrayItem);
    }

    // Process complex array item (object)
    static processComplexArrayItem(arrayItem, arrayItemNodeId, parentNodeId, arrayIndex, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        const objectPropertyEntries = Object.entries(arrayItem);
        const primitivePropertyEntries = objectPropertyEntries.filter(([, propertyValue]) => propertyValue === null || typeof propertyValue !== 'object');
        const nestedPropertyEntries = objectPropertyEntries.filter(([, propertyValue]) => propertyValue && typeof propertyValue === 'object' && !JsonDiagramParser.isEmpty(propertyValue));

        const requiresIntermediateNode = primitivePropertyEntries.length > 0 || nestedPropertyEntries.length > 1;

        if (requiresIntermediateNode) {
            JsonDiagramParser.createIntermediateArrayNode(
                arrayItem,
                arrayItemNodeId,
                parentNodeId,
                arrayIndex,
                primitivePropertyEntries,
                nestedPropertyEntries,
                diagramNodes,
                diagramConnectors,
                currentPath,
                parentKeyName
            );
        } else {
            JsonDiagramParser.createDirectArrayNode(
                nestedPropertyEntries[0],
                arrayItemNodeId,
                parentNodeId,
                arrayIndex,
                diagramNodes,
                diagramConnectors,
                currentPath,
                parentKeyName
            );
        }
    }

    // Create intermediate node for complex array items
    static createIntermediateArrayNode(arrayItem, arrayItemNodeId, parentNodeId, arrayIndex, primitivePropertyEntries, nestedPropertyEntries, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        let intermediateNodeContent;
        let isIntermediateLeafNode;
        let intermediateNodeAnnotations;

        if (primitivePropertyEntries.length > 0) {
            isIntermediateLeafNode = true;
            intermediateNodeAnnotations = JsonDiagramParser.createArrayItemPrimitiveAnnotations(primitivePropertyEntries, arrayItemNodeId);
            intermediateNodeContent = primitivePropertyEntries.map(([propertyKey, propertyValue]) => `${propertyKey}: ${propertyValue}`).join('\n');
        } else {
            isIntermediateLeafNode = false;
            intermediateNodeContent = `Item ${arrayIndex}`;
            intermediateNodeAnnotations = [{ content: intermediateNodeContent }];
        }

        const arrayItemIntermediateNode = {
            id: arrayItemNodeId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: intermediateNodeAnnotations,
            additionalInfo: { isLeaf: isIntermediateLeafNode },
            data: {
                path: `${currentPath}/${parentKeyName}[${arrayIndex}]`,
                title: intermediateNodeContent,
                actualdata: intermediateNodeContent
            }
        };

        diagramNodes.push(arrayItemIntermediateNode);
        diagramConnectors.push({
            id: `connector-${parentNodeId}-${arrayItemNodeId}`,
            sourceID: parentNodeId,
            targetID: arrayItemNodeId
        });

        JsonDiagramParser.processNestedPropertyEntries(
            nestedPropertyEntries,
            arrayItemNodeId,
            arrayIndex,
            diagramNodes,
            diagramConnectors,
            currentPath,
            parentKeyName
        );
    }

    // Create annotations for array item primitive properties
    static createArrayItemPrimitiveAnnotations(primitivePropertyEntries, arrayItemNodeId) {
        return primitivePropertyEntries.flatMap(([propertyKey, propertyValue]) => {
            const formattedPropertyValue = String(propertyValue);
            const propertyAnnotations = [{ id: `Key_${arrayItemNodeId}_${propertyKey}`, content: `${propertyKey}:` }];
            propertyAnnotations.push({ id: `Value_${arrayItemNodeId}_${propertyKey}`, content: formattedPropertyValue });
            return propertyAnnotations;
        });
    }

    // Process nested property entries for array items
    static processNestedPropertyEntries(nestedPropertyEntries, arrayItemNodeId, arrayIndex, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        nestedPropertyEntries.forEach(([nestedPropertyKey, nestedPropertyValue]) => {
            const nestedPropertyNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(`${arrayItemNodeId}-${nestedPropertyKey}`);
            const nestedPropertyChildCount = JsonDiagramParser.getObjectLength(nestedPropertyValue);
            const nestedPropertyAnnotations = [{ content: nestedPropertyKey }];
            
            if (nestedPropertyChildCount > 0) {
                nestedPropertyAnnotations.push({ content: `{${nestedPropertyChildCount}}` });
            }

            const nestedPropertyNode = {
                id: nestedPropertyNodeId,
                width: DEFAULT_NODE_WIDTH,
                height: DEFAULT_NODE_HEIGHT,
                annotations: nestedPropertyAnnotations,
                additionalInfo: { isLeaf: false, mergedContent: `${nestedPropertyKey} {${nestedPropertyChildCount}}` },
                data: {
                    path: `${currentPath}/${parentKeyName}[${arrayIndex}].${nestedPropertyKey}`,
                    title: nestedPropertyKey,
                    actualdata: nestedPropertyKey
                }
            };
            
            diagramNodes.push(nestedPropertyNode);
            diagramConnectors.push({
                id: `connector-${arrayItemNodeId}-${nestedPropertyNodeId}`,
                sourceID: arrayItemNodeId,
                targetID: nestedPropertyNodeId
            });

            JsonDiagramParser.processNestedData(
                nestedPropertyValue,
                nestedPropertyNodeId,
                diagramNodes,
                diagramConnectors,
                `${currentPath}/${parentKeyName}[${arrayIndex}].${nestedPropertyKey}`,
                nestedPropertyKey
            );
        });
    }

    // Create direct node for single nested object in array
    static createDirectArrayNode(nestedEntry, arrayItemNodeId, parentNodeId, arrayIndex, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        const [singleNestedKey, singleNestedValue] = nestedEntry;
        const directNestedNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(`${arrayItemNodeId}-${singleNestedKey}`);
        const directNestedChildCount = JsonDiagramParser.getObjectLength(singleNestedValue);
        const directNestedAnnotations = [{ content: singleNestedKey }];
        
        if (directNestedChildCount > 0) {
            directNestedAnnotations.push({ content: `{${directNestedChildCount}}` });
        }

        const directConnectionNode = {
            id: directNestedNodeId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: directNestedAnnotations,
            additionalInfo: { isLeaf: false, mergedContent: `${singleNestedKey} {${directNestedChildCount}}` },
            data: {
                path: `${currentPath}/${parentKeyName}[${arrayIndex}].${singleNestedKey}`,
                title: singleNestedKey,
                actualdata: singleNestedKey
            }
        };
        
        diagramNodes.push(directConnectionNode);
        diagramConnectors.push({
            id: `connector-${parentNodeId}-${directNestedNodeId}`,
            sourceID: parentNodeId,
            targetID: directNestedNodeId
        });

        JsonDiagramParser.processNestedData(
            singleNestedValue,
            directNestedNodeId,
            diagramNodes,
            diagramConnectors,
            `${currentPath}/${parentKeyName}[${arrayIndex}].${singleNestedKey}`,
            singleNestedKey
        );
    }

    // Process primitive array item
    static processPrimitiveArrayItem(arrayItem, arrayItemNodeId, parentNodeId, arrayIndex, diagramNodes, diagramConnectors, currentPath, parentKeyName) {
        const primitiveArrayContent = String(arrayItem);
        const primitiveArrayNode = {
            id: arrayItemNodeId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: [{ content: primitiveArrayContent }],
            additionalInfo: { isLeaf: true },
            data: {
                path: `${currentPath}/${parentKeyName}[${arrayIndex}]`,
                title: primitiveArrayContent,
                actualdata: primitiveArrayContent
            }
        };
        
        diagramNodes.push(primitiveArrayNode);
        diagramConnectors.push({
            id: `connector-${parentNodeId}-${arrayItemNodeId}`,
            sourceID: parentNodeId,
            targetID: arrayItemNodeId
        });
    }

    // Process object elements and create corresponding nodes
    static processObjectElements(nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath) {
        const objectPropertyEntries = Object.entries(nestedElement);
        const primitiveObjectKeys = objectPropertyEntries
            .filter(([, propertyValue]) => propertyValue === null || typeof propertyValue !== 'object')
            .map(([propertyKey]) => propertyKey);
        const nestedObjectKeys = objectPropertyEntries
            .filter(([, propertyValue]) => propertyValue && typeof propertyValue === 'object')
            .map(([propertyKey]) => propertyKey);

        if (primitiveObjectKeys.length > 0) {
            JsonDiagramParser.createLeafNodeForPrimitives(primitiveObjectKeys, nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath);
        }

        JsonDiagramParser.processNestedObjectProperties(nestedObjectKeys, nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath);
    }

    // Create leaf node for primitive properties in nested object
    static createLeafNodeForPrimitives(primitiveObjectKeys, nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath) {
        const primitiveLeafNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(`${parentNodeId}-leaf`);
        const primitiveObjectAnnotations = primitiveObjectKeys.flatMap(primitiveKey => {
            const primitiveRawValue = nestedElement[primitiveKey] == null ? '' : String(nestedElement[primitiveKey]);
            const primitiveKeyValueAnnotations = [{
                id: `Key_${primitiveLeafNodeId}_${primitiveKey}`,
                content: `${primitiveKey}:`
            }];
            primitiveKeyValueAnnotations.push({
                id: `Value_${primitiveLeafNodeId}_${primitiveKey}`,
                content: primitiveRawValue
            });
            return primitiveKeyValueAnnotations;
        });

        const combinedPrimitiveObjectContent = primitiveObjectKeys
            .map(primitiveKey => `${primitiveKey}: ${nestedElement[primitiveKey]}`)
            .join('\n');

        const primitiveObjectLeafNode = {
            id: primitiveLeafNodeId,
            width: DEFAULT_NODE_WIDTH,
            height: DEFAULT_NODE_HEIGHT,
            annotations: primitiveObjectAnnotations,
            additionalInfo: { isLeaf: true },
            data: {
                path: `${currentPath}.leaf`,
                title: combinedPrimitiveObjectContent,
                actualdata: combinedPrimitiveObjectContent
            }
        };
        
        diagramNodes.push(primitiveObjectLeafNode);
        diagramConnectors.push({
            id: `connector-${parentNodeId}-${primitiveLeafNodeId}`,
            sourceID: parentNodeId,
            targetID: primitiveLeafNodeId
        });
    }

    // Process nested object properties recursively
    static processNestedObjectProperties(nestedObjectKeys, nestedElement, parentNodeId, diagramNodes, diagramConnectors, currentPath) {
        nestedObjectKeys.forEach(nestedObjectProperty => {
            const nestedObjectPropertyValue = nestedElement[nestedObjectProperty];
            if (JsonDiagramParser.isEmpty(nestedObjectPropertyValue)) return;
            
            const nestedObjectPropertyChildCount = JsonDiagramParser.getObjectLength(nestedObjectPropertyValue);
            const nestedObjectPropertyNodeId = JsonDiagramParser.convertUnderScoreToPascalCase(`${parentNodeId}-${nestedObjectProperty}`);
            const nestedObjectPropertyAnnotations = [{ content: nestedObjectProperty }];
            
            if (nestedObjectPropertyChildCount > 0) {
                nestedObjectPropertyAnnotations.push({ content: `{${nestedObjectPropertyChildCount}}` });
            }

            const nestedObjectPropertyNode = {
                id: nestedObjectPropertyNodeId,
                width: DEFAULT_NODE_WIDTH,
                height: DEFAULT_NODE_HEIGHT,
                annotations: nestedObjectPropertyAnnotations,
                additionalInfo: { isLeaf: false, mergedContent: `${nestedObjectProperty} {${nestedObjectPropertyChildCount}}` },
                data: {
                    path: `${currentPath}.${nestedObjectProperty}`,
                    title: nestedObjectProperty,
                    actualdata: nestedObjectProperty
                }
            };
            
            diagramNodes.push(nestedObjectPropertyNode);
            diagramConnectors.push({
                id: `connector-${parentNodeId}-${nestedObjectPropertyNodeId}`,
                sourceID: parentNodeId,
                targetID: nestedObjectPropertyNodeId
            });
            
            JsonDiagramParser.processNestedData(
                nestedObjectPropertyValue,
                nestedObjectPropertyNodeId,
                diagramNodes,
                diagramConnectors,
                `${currentPath}.${nestedObjectProperty}`,
                nestedObjectProperty
            );
        });
    }

    // Check if there are multiple root nodes (nodes without parents)
    static hasMultipleRoots(diagramNodes, diagramConnectors) {
        const allNodeIds = diagramNodes.map(diagramNode => diagramNode.id);
        const connectedNodeIds = new Set(diagramConnectors.map(connector => connector.targetID));
        const rootNodeIds = allNodeIds.filter(nodeId => !connectedNodeIds.has(nodeId));
        return rootNodeIds.length > 1;
    }

    // Adds an artificial main root if multiple roots exist
    static checkMultiRoot(diagramNodes, diagramConnectors) {
        const allNodeIds = diagramNodes.map(diagramNode => diagramNode.id);
        const connectedNodeIds = new Set(diagramConnectors.map(connector => connector.targetID));
        const rootNodeIds = allNodeIds.filter(nodeId => !connectedNodeIds.has(nodeId));
        
        if (rootNodeIds.length > 1) {
            const artificialMainRootId = 'main-root';
            const artificialMainRootNode = {
                id: artificialMainRootId,
                width: 40,
                height: 40,
                annotations: [{ content: '' }],
                additionalInfo: { isLeaf: false },
                data: { path: 'MainRoot', title: 'Main Artificial Root', actualdata: '' }
            };
            
            diagramNodes.push(artificialMainRootNode);
            rootNodeIds.forEach(rootNodeId => {
                diagramConnectors.push({
                    id: `connector-${artificialMainRootId}-${rootNodeId}`,
                    sourceID: artificialMainRootId,
                    targetID: rootNodeId
                });
            });
        }
    }

    // Returns count of children for objects/arrays
    static getObjectLength(targetElement) {
        if (!targetElement || typeof targetElement !== 'object') return 0;
        if (Array.isArray(targetElement)) return targetElement.length;

        const elementPropertyEntries = Object.entries(targetElement);
        const primitivePropertyEntries = elementPropertyEntries.filter(([, propertyValue]) => propertyValue === null || typeof propertyValue !== 'object');
        const arrayPropertyEntries = elementPropertyEntries.filter(([, propertyValue]) => Array.isArray(propertyValue));
        const objectPropertyEntries = elementPropertyEntries.filter(
            ([, propertyValue]) => propertyValue && typeof propertyValue === 'object' && !Array.isArray(propertyValue)
        );

        return (primitivePropertyEntries.length > 0 ? 1 : 0) + arrayPropertyEntries.length + objectPropertyEntries.length;
    }

    // Converts strings from underscore/hyphen to PascalCase segments
    static convertUnderScoreToPascalCase(inputString) {
        if (!inputString) return inputString;
        return inputString
            .split('-')
            .map(hyphenSeparatedPart =>
                hyphenSeparatedPart
                    .split('_')
                    .map((underscoreSeparatedWord, wordIndex) =>
                        wordIndex > 0
                            ? underscoreSeparatedWord.charAt(0).toUpperCase() + underscoreSeparatedWord.slice(1).toLowerCase()
                            : underscoreSeparatedWord
                    )
                    .join('')
            )
            .join('-');
    }

    // Checks if a value is an empty array, an empty object, or not set
    static isEmpty(valueToCheck) {
        if (Array.isArray(valueToCheck)) return valueToCheck.length === 0;
        if (valueToCheck && typeof valueToCheck === 'object') return Object.keys(valueToCheck).length === 0;
        return false;
    }

    // Helper method to check if a string is empty or contains only whitespace
    static isEmptyOrWhitespace(stringToCheck) {
        return !stringToCheck || stringToCheck.trim().length === 0;
    }
}

export default JsonDiagramParser;