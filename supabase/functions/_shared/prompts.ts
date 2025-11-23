import { NewsAngle, ResearchResults } from "./types.ts";
import { QUERIES_PER_ANGLE } from "./config.ts";

export const contextGeneration = (topic: string) => `
  You are tasked with creating contextual guidance for a language model that will be conducting press reviews and generating search queries on a specific topic. The context should strike a balance between being too hobbyistic (overly casual/amateur) and too professional (overly formal/corporate) - aim for an informed, accessible middle ground suitable for press review purposes.

  <topic>
  ${topic}
  </topic>

  Your task is to generate a comprehensive context for the topic above that will guide a language model in creating relevant search queries for press review purposes. You need to prepare four key components:

  1. Audience: Define the target readership that would be interested in press coverage of this topic - these should be informed individuals who seek current developments and news
  2. Persona: Create a persona for the language model to adopt - someone knowledgeable but accessible, suitable for press review work
  3. Goal: Establish what the language model should aim to achieve when covering this topic from a press review perspective
  4. News Angles: Identify distinct "angles of attack" for researching this topic. These replace generic themes and must be actionable search directions.

  Key Requirements:
  - Focus on press review context - the output should guide toward newsworthy, current developments rather than hobbyistic content
  - Maintain an informed but accessible tone
  - The audience should consist of professionals and informed individuals seeking current information
  - News Angles must be specific and actionable, not broad topics
  - For each News Angle, provide a list of "keywords" that serve as TRIGGER WORDS for finding relevant news.

  Examples:

  For topic "Renewable Energy Technology":

  {
    "audience": "Policy makers, industry professionals, investors, and informed citizens who follow developments in clean energy solutions and their market impact.",
    "persona": "You are an informed energy sector analyst who tracks emerging technologies, policy changes, and market developments in renewable energy.",
    "goal": "Your goal is to identify and analyze significant developments in renewable energy technology, policy changes, and market shifts.",
    "news_angles": [
      {
        "name": "Technological Breakthroughs",
        "description": "New efficiency records and material science discoveries",
        "keywords": ["efficiency record", "perovskite", "breakthrough", "lab results", "commercialization"]
      },
      {
        "name": "Policy & Regulation",
        "description": "Government incentives, bans, and international agreements",
        "keywords": ["subsidy", "tax credit", "ban", "mandate", "COP summit", "legislation"]
      },
      {
        "name": "Market Movements",
        "description": "Major investments, mergers, and bankruptcies",
        "keywords": ["acquisition", "merger", "IPO", "bankruptcy", "investment round", "quarterly earnings"]
      }
    ]
  }

  Generate your response as a JSON object with the exact structure shown in the examples above. Your output should focus on creating context that will lead to relevant, newsworthy search queries.
`;

export const queryGeneration = (
  topic: string,
  context: { persona: string; goal: string; audience: string; news_angles: NewsAngle[] }
) => `
        ${context.persona}
  
        ${context.goal}
  
        ${context.audience}
  
        You will be generating a list of press review SERP (Search Engine Results Page) queries based on a given topic and specific news angles. Your goal is to create unique, relevant search queries that would be useful for finding press coverage and reviews.

        Here is the topic you need to work with:
        <topic>
        ${topic}
        </topic>

        Here are the specific News Angles to investigate:
        <news_angles>
        ${JSON.stringify(context.news_angles, null, 2)}
        </news_angles>

        Your task is to generate search queries for EACH provided News Angle.
        
        Methodology:
        1. Iterate through each News Angle provided above.
        2. For each angle, use its defined "keywords" to construct precise search queries.
        3. Combine the main topic with the angle's keywords to create targeted searches.

        Important requirements:
        - Generate ${QUERIES_PER_ANGLE} queries per News Angle.
        - Ensure queries are distinct and cover different aspects of the angle.
        - Keep queries short and concise (maximum 5-7 words each).
        - Focus on queries that would return press coverage, reviews, or news articles.
        - Do not generate queries that are not strictly related to the topic.

        Current context:
        - Today's date is ${new Date().toISOString()}
        - Use this date awareness to ensure your queries are timely (e.g. include year if relevant).

        Before generating your final list, use the scratchpad below to think through your approach:

        <scratchpad>
        1. What are the key aspects of the topic that press would cover?
        2. How can you incorporate the provided angles and keywords?
        3. How can you ensure each query is distinct while staying relevant?
        </scratchpad>

        After your analysis, provide your final answer in the exact JSON format below. Return a flat list of all queries combined. Your response should contain only the JSON output with no additional text or explanation:

        {
          "queries": [list of queries]
        }
      `;

export const sourceEvaluation = (
  topic: string,
  source: string,
  context: { persona: string; goal: string; audience: string }
) => `
        You are an intelligent analyst conducting research for a press review. Your task is to score a news source on a scale of 1-10 based on its relevance and quality for the specified audience and goals.

        <context>
        <persona>${context.persona}</persona>
        <goal>${context.goal}</goal>
        <audience>${context.audience}</audience>
        </context>

        Here is the topic:
        <topic>
        ${topic}
        </topic>

        Here is the source to evaluate:
        <source>
        ${source}
        </source>

        Your job is to assign a score from 1 (completely irrelevant/low quality) to 10 (perfectly aligned, high value) based on THREE criteria:

        1. **PERSONA ALIGNMENT (Dominant Factor):**
           - Does this source match the specific audience, persona, and goals defined in the context above?
           - Is this content useful for the target audience?
           - Does it align with the analyst's perspective and objectives?
           
        2. **INFORMATION DENSITY (Supporting Factor):**
           - Does the source contain concrete facts, dates, numbers, or specific details?
           - Or is it mostly fluff, speculation, or generic statements?
           
        3. **NOVELTY (Supporting Factor):**
           - Is this actual news or new information?
           - Is the publication date recent enough to be considered current?
           - Or is it outdated, rehashed, or purely promotional content?

        **CRITICAL RULE:** Persona alignment alone is NOT sufficient. A source that matches the persona but lacks information density or novelty should receive a LOW score (below 6).

        **STRICT THRESHOLD:** Only sources scoring 6 or above will be included in the final press review. Be rigorous in your evaluation.

        Important context: Today's date is ${new Date().toISOString()}. Use this to assess recency.

        Your response must be in the following JSON format:

        {
          "reasoning": "[Your detailed explanation covering all three criteria and how they contribute to the final score]",
          "score": [integer from 1 to 10]
        }

        Your output should consist of only the JSON response with no additional text or formatting.
      `;

export const contentExtraction = (
  topic: string,
  source: string,
  context: { persona: string; goal: string; audience: string }
) => `
        You are an intelligent analyst extracting specific, high-value data points for a press review.

        <context>
        <persona>${context.persona}</persona>
        <goal>${context.goal}</goal>
        <audience>${context.audience}</audience>
        </context>

        <topic>
        ${topic}
        </topic>

        <source>${JSON.stringify(source)}</source>

        Your task is to extract specific data points that will be valuable for the target audience defined above. Focus on CONCRETE, SPECIFIC information rather than generic summaries.

        Extract the following fields:

        1. **main_event** (REQUIRED): What specifically happened? Describe the core event, announcement, or development. Be concrete and specific.

        2. **quantitative_data** (OPTIONAL): Extract any numbers, dates, prices, percentages, or measurable facts. If the article contains ZERO quantitative data, return an empty array. DO NOT HALLUCINATE OR INVENT NUMBERS.

        3. **quotes** (REQUIRED): Direct citations from people mentioned in the article. Include the speaker's name/role with each quote. If no quotes exist, return an empty array.

        4. **opinions** (HIGH PRIORITY): Interesting perspectives, interpretations, controversies, or subjective viewpoints expressed in the article. This includes both author opinions and quoted expert opinions. Focus on what makes this article's perspective unique or valuable.

        5. **unique_angle** (REQUIRED): What does this article offer that goes BEYOND general knowledge about the topic? Why would someone read this specific article? What's the novel insight, exclusive information, or unique framing? Compare to what an informed person would already know, NOT to other articles.

        Important constraints:
        - Extract ONLY information present in the source
        - Be specific and concrete - avoid generic statements
        - Use the generation context to prioritize information valuable to the target audience
        - DO NOT invent or hallucinate data that isn't in the source
        - If a field has no relevant data, use empty array [] or explain briefly why the article still has value

        Structure your response as a single, valid JSON object:

        {
          "main_event": "specific description of what happened",
          "quantitative_data": ["concrete number/date/metric 1", "concrete number/date/metric 2"],
          "quotes": ["'Quote text' - Person Name, Role", "'Another quote' - Person Name, Role"],
          "opinions": ["interesting perspective or interpretation 1", "controversial viewpoint 2"],
          "unique_angle": "what makes this article valuable compared to general knowledge on the topic"
        }

        Your final output should contain only the JSON object with no additional text, formatting, or explanations.
      `;

// TODO: The general summary does not bring any value to the report. It should combine some information from the segments and provide a high-level overview of the report.
export const contentSynthesis = (topic: string, researchResults: ResearchResults) => `
        You are a press journalist specialising in the provided topic. You will be creating a press review report based on research results provided to you. The research results contains multiple sources with summaries, key facts, opinions, and other metadata.

        <topic>${topic}</topic>
        <research_results>${JSON.stringify(researchResults)}</research_results>

        Your task is to analyse the provided research results and create a structured press review report. You should:

        1. Select the most valuable sources: Review all sources and identify those that provide the most significant, relevant, and substantive information. Discard sources that are redundant, low-quality, or provide minimal value.

        2. Categorize sources: Group the selected sources into logical categories based on their subject matter, industry, or theme (e.g., "Technology & AI", "Healthcare", "Business & Finance", "Politics", etc.).

        3. Create summaries: For each category, write a concise summary that synthesizes the key information from all sources in that group, incorporating both facts and opinions from the source data.

        4. Structure the output: Format your response as a JSON object following the exact structure specified below.

        Before providing your final answer, work through your analysis:
        - First, list all sources and briefly evaluate their value/relevance
        - Identify which sources to keep and which to discard
        - Group the selected sources into categories
        - Plan the summaries for each category
        - Draft the general summary for the overall report

        Your final output must follow this exact JSON structure:

        {
          "content": {
            "general_summary": "[a general summary about what can be found in the current press review report]",
            "segments": [
              {
                "category": "[the category of the sources in the given segment]",
                "summary": "[a concise summary of this specific segment's contribution to the topic]",
                "sources": [
                  {
                    "title": "[the title of the article or source]",
                    "summary": "[original summary of the source from the research data]",
                    "link": "[the URL of the source]"
                  }
                ]
              }
            ]
          }
        }


        Important guidelines:
        - Only include sources that add meaningful value to the report
        - Ensure categories are logical and mutually exclusive
        - Write segment summaries that synthesize information across all sources in that category
        - Use the original summaries from the research data for individual source summaries
        - Include key facts and opinions from the research data in your segment summaries
        - Make sure the general summary provides a detailed overview of all segments
        - Write in a professional, journalistic style

        Your final response should contain only the JSON output as specified above, without any additional text or explanation.
      `;
