import OpenAI from 'openai';

// Initialize the OpenAI client
// Ensure your OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface CategorizeMemeResult {
  suggestedCategory?: string | null;
  error?: string;
}

export async function getAICategoryForMeme(imageUrl: string): Promise<CategorizeMemeResult> {
  if (!imageUrl) {
    return { error: 'Image URL is required' };
  }

  console.log(`[aiCategorizer] Getting AI category for URL: ${imageUrl}`);

  const prompt = `You are an expert meme categorizer, specializing in internet memes. 
  Analyze the content, style, and potential humor of the following meme image. 
  Based on your analysis, come up with the single most appropriate category name for this meme.
  Your response should be ONLY the category name, which should be 1-3 words. For example: "Gaming", "Work Humor", "Relatable Life".
  Do not add any extra explanation, punctuation, or conversational text. Just the category name.`;

  const modelName = "gpt-4o"; // Or "gpt-4-turbo"
  console.log(`[aiCategorizer] Calling OpenAI model: ${modelName}`);

  try {
    const openaiResponse = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 30,
      temperature: 0.1,
      n: 1,
    });

    console.log("[aiCategorizer] OpenAI response received");
    const choice = openaiResponse.choices[0];
    const suggestedCategory = choice?.message?.content?.trim();

    if (!suggestedCategory) {
      console.error("[aiCategorizer] OpenAI response did not contain message content.", choice);
      return { error: 'AI did not return a category suggestion.' };
    }

    // Clean the category: remove any non-alphanumeric characters except spaces, &, and -
    const suggestedCategoryCleaned = suggestedCategory.replace(/[^a-zA-Z0-9 &\/-]/g, '').trim();
    console.log(`[aiCategorizer] Suggested category: "${suggestedCategoryCleaned}"`);
    
    return { suggestedCategory: suggestedCategoryCleaned };
  } catch (error: unknown) {
    console.error('[aiCategorizer] Error calling OpenAI API:', error);
    if (error instanceof OpenAI.APIError) {
      return { error: `OpenAI API Error: ${error.name} - ${error.message}` };
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Internal server error during AI categorization: ${errorMessage}` };
  }
}