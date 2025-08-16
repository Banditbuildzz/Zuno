import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PropertyData, RawGeminiResponse, NearMeProperty, GroundingSource } from '../types';

let apiKey: string | undefined;
try {
  apiKey = process.env.API_KEY;
} catch (e) {
  apiKey = undefined;
  console.warn("Could not read 'process.env.API_KEY' in geminiService. This is expected in a direct browser deployment. AI features will be limited unless a backend proxy is used.");
}

if (!apiKey) {
  console.error("CRITICAL SECURITY WARNING: API_KEY environment variable not set for Gemini. For local development, ensure it is available. For production, this key MUST NOT be in client-side code. Use a backend proxy. Zuno's AI features will be limited.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY_PLACEHOLDER_DO_NOT_USE_IN_PROD" });

const extractJsonContent = (text: string | undefined): string | null => {
  if (typeof text !== 'string' || text.trim() === '') {
    return null;
  }
  const trimmedText = text.trim();
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const fenceMatch = trimmedText.match(fenceRegex);

  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim();
  }
  return trimmedText; 
};

const getBasePrompt = (inputQuery: string) => ({
  subject: `<The input address or business name you searched for>`,
  best_contact: {
    phone: `<string|null>`,
    email: `<string|null>`,
    confidence: `<High|Medium|Low|null>`
  },
  alt_contacts: [
    {
      phone: `<string|null>`,
      email: `<string|null>`,
      note: `<Why is this included? e.g., 'Previous owner', 'Associated business contact'>`
    }
  ],
  search_log: [
    `<The exact search query #1 you used>`,
    `<The exact search query #2 you used>`
  ],
  sources: [
    {
      "label": `<e.g., Sangamon County PVA, Whitepages, KY SOS>`,
      "url": `<The URL of the source if available>`,
      "data_point": `<e.g., owner name, phone, email>`
    }
  ],
  generated_at: `${new Date().toISOString()}`
});


export const getContactIntelligence = async (property: PropertyData, isDeepResearch: boolean = false): Promise<RawGeminiResponse> => {
  const inputQuery = [
    property.contactName?.trim(),
    property.address?.trim(),
    property.city?.trim(),
    property.state?.trim(),
    property.zipCode?.trim(),
  ].filter(Boolean).join(', ');

  const zunoStandardPrompt = `
### ROLE
You are **Zuno – Property-Contact Intelligence Agent**.
Mission: return the most accurate, up-to-date owner phone & e-mail for any U.S. property or business, with full transparency of how you found it.

### CONTEXT
You are performing this search for the following subject:
**INPUT: "${inputQuery}"**

### WORKFLOW (EXECUTE THESE STEPS IN ORDER, EVERY QUERY)
1.  **Clarify Input**: If the input is ambiguous (e.g., "Main St" without a city), you must note this in the 'message' field of an error response.
2.  **Normalize & Enrich**: Internally, standardize the address. Find its county and parcel ID.
3.  **Search Plan**: Build a list of search strings (max 8) to execute. Prioritize official sources.
    *   **Priority 1: Government Records:** County PVA/Assessor, tax rolls, clerk of courts.
    *   **Priority 2: Public/Commercial Directories:** Whitepages, TruePeopleSearch, business registries (OpenCorporates).
    *   **Priority 3: Other Public Data:** Utility filings, permit applications.
4.  **Fetch & Cross-Check**:
    *   Pull raw contact data from every viable page.
    *   Cross-verify: A phone/e-mail is **High** confidence if in **at least 2 independent sources** OR **1 official government record**. **Medium** if from a single high-quality source. **Low** if from a single unofficial source.
5.  **Output (JSON only)**: Return ONLY the JSON object below. Do not add text outside the JSON block. Use \`null\` for missing data.

\`\`\`json
${JSON.stringify(getBasePrompt(inputQuery), null, 2)}
\`\`\`
`;

  const zunoDeepResearchPrompt = `
### ROLE
You are **Zuno – DEEP RESEARCH Property-Contact Intelligence Agent**.
Mission: Conduct an exhaustive search to return the most accurate, up-to-date owner phone & e-mail for any U.S. property or business, prioritizing direct-contact info and uncovering hidden links. Full transparency is mandatory.

### CONTEXT
You are performing a DEEP RESEARCH search for the following subject:
**INPUT: "${inputQuery}"**

### DEEP RESEARCH WORKFLOW (EXECUTE THESE STEPS IN ORDER, EVERY QUERY)
1.  **Clarify & Deconstruct Input**: If the input is ambiguous (e.g., "Main St" without a city), note this in an error message. Deconstruct the input into entity name, address, city, state for precise searching.
2.  **Normalize & Enrich**: Standardize the address to USPS format. Find its county, and derive the parcel ID. Research the entity to determine if it's an individual, LLC, Trust, or Corporation.
3.  **Exhaustive Search Plan**: Build a list of diverse search strings (max 15) to execute. Think laterally.
    *   **Priority 1: Government Records:** County PVA/Assessor, tax rolls, clerk of courts (for deeds, mortgages), state business/corporate filings (to find registered agents).
    *   **Priority 2: Advanced Public/Commercial Directories:** Use queries that link names to addresses. Search for relatives or business associates who might be listed as contacts.
    *   **Priority 3: Obscure & Historical Data:** Search for utility filings, permit applications, professional licenses, archived news articles, or old property listings that might contain contact info.
    *   **Priority 4: Corporate Structure:** If it's an LLC or Corp, find the officers/members and search for their individual contact details.
4.  **Fetch & Rigorous Cross-Check**:
    *   Pull raw contact data + timestamp from every viable page you access.
    *   **High Confidence**: Verified across **at least 3 independent sources** OR **1 primary government record (deed, tax bill) cross-verified with any other source**.
    *   **Medium Confidence**: Found on at least 2 independent sources, or a single high-quality official source (like a business registry).
    *   **Low Confidence**: Found only on a single unofficial source.
5.  **Output (JSON only)**: Return ONLY the JSON object below. Do not add comments or any other text outside the JSON block. Populate every field. Use \`null\` if truly no data is found.

\`\`\`json
${JSON.stringify(getBasePrompt(inputQuery), null, 2)}
\`\`\`
`;
  
  const zunoPrompt = isDeepResearch ? zunoDeepResearchPrompt : zunoStandardPrompt;

  let rawResponseTextForErrorLogging: string | undefined = undefined; 

  try {
    if (!apiKey || apiKey === "MISSING_API_KEY_PLACEHOLDER_DO_NOT_USE_IN_PROD") {
      return { error: "CRITICAL CONFIGURATION ERROR: Gemini API Key not configured. AI search cannot be performed." };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: zunoPrompt,
      config: {
        temperature: 0.1,
        topP: 0.90,
        tools: [{ googleSearch: {} }],
      },
    });
    
    rawResponseTextForErrorLogging = response.text; 

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    let groundingSources: GroundingSource[] = [];
    if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
        groundingSources = groundingMetadata.groundingChunks
            .map(chunk => ({
                uri: chunk.web?.uri || chunk.retrievedContext?.uri || "N/A",
                title: chunk.web?.title || chunk.retrievedContext?.title || "Unknown Source"
            }))
            .filter(source => source.uri !== "N/A");
    }
    
    const jsonToParse = extractJsonContent(response.text);

    if (!jsonToParse) {
      let detailedErrorReason = "AI response did not contain text output or was empty.";
       if (response.promptFeedback?.blockReason) {
        detailedErrorReason = `AI response was blocked. Reason: ${response.promptFeedback.blockReason}.`;
      }
      return {
        error: `AI System Error: ${detailedErrorReason}.`,
        groundingSources: groundingSources,
      };
    }
    
    let parsedResult = JSON.parse(jsonToParse) as Partial<RawGeminiResponse>;
    parsedResult.groundingSources = groundingSources;
      
    if (!parsedResult.generated_at) {
        parsedResult.generated_at = new Date().toISOString();
    }

    return parsedResult;

  } catch (error) {
    let errorMessage = "Failed to get a response from AI or parse it.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    const aiResponseSnippet = rawResponseTextForErrorLogging ? ` AI Response Snippet: "${rawResponseTextForErrorLogging.substring(0, 100)}..."` : "";
    console.error(`Error in getContactIntelligence: ${errorMessage}. ${aiResponseSnippet}`, error);
    
     return { 
        error: `System Error during AI search: ${errorMessage}.`,
        groundingSources: [],
     };
  }
};


export const findPropertiesNearLocation = async (latitude: number, longitude: number): Promise<NearMeProperty[]> => {
  const prompt = `
You are an expert real estate opportunity scout. Your task is to identify 3 to 5 potentially interesting or beneficial properties for a real estate analyst near the provided geographic coordinates: ${latitude}, ${longitude}.

Use your search tool to find properties that are:
-   Currently for sale.
-   Recently sold (within the last 6-12 months), as this indicates market activity.
-   Part of a new development project.
-   Zoned for commercial or mixed-use in a high-growth area.
-   Distressed properties (e.g., pre-foreclosure, auction).

For each property you identify, you must provide:
1.  **A unique ID:** Generate a simple unique ID like "near-prop-1", "near-prop-2".
2.  **Address, City, and State:** The full address of the property.
3.  **A brief, neutral description:** What is the property? (e.g., "A 3-story commercial building", "A vacant lot zoned for residential use").
4.  **The reason it is beneficial:** A concise explanation of why this property is notable. (e.g., "Listed for sale 2 weeks ago, below market average.", "Located in an area with major public transport investment.", "Part of the upcoming 'Downtown Revitalization' project.").

Return your findings as a JSON array of objects, strictly adhering to the provided schema. Do not include any properties if you cannot find a compelling reason for their benefit.
      `;

  try {
    if (!apiKey || apiKey === "MISSING_API_KEY_PLACEHOLDER_DO_NOT_USE_IN_PROD") {
      console.error("findPropertiesNearLocation: API Key is not configured.");
      return [];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique identifier for the property, e.g., 'near-prop-1'." },
              address: { type: Type.STRING, description: "The street address of the property." },
              city: { type: Type.STRING, description: "The city where the property is located." },
              state: { type: Type.STRING, description: "The state abbreviation, e.g., 'CA'." },
              description: { type: Type.STRING, description: "A brief, neutral description of the property." },
              reasonForBenefit: { type: Type.STRING, description: "A concise explanation of why this property is a potentially beneficial opportunity." }
            },
            required: ["id", "address", "city", "state", "description", "reasonForBenefit"]
          }
        }
      }
    });

    if (!response.text || !response.text.trim()) {
      console.warn("findPropertiesNearLocation: AI returned an empty response.");
      return [];
    }

    const jsonToParse = extractJsonContent(response.text);
    if (!jsonToParse) {
        console.error("findPropertiesNearLocation: Could not extract JSON from AI response.", response.text);
        return [];
    }

    const properties = JSON.parse(jsonToParse);
    if (Array.isArray(properties)) {
      return properties as NearMeProperty[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching or parsing nearby properties:", error);
    return [];
  }
};