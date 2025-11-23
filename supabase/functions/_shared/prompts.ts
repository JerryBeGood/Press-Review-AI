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

export const sourceEvaluation = (topic: string, source: string) => `
        You are a press review research specialist. Your task is to evaluate whether a news source is relevant for press review coverage on a specified topic.

        Here is the topic:
        <topic>
        ${topic}
        </topic>

        Here is the source:
        <source>
        ${source}
        </source>

        Your job is to determine whether this source is relevant for press review coverage of the given topic. 

        A source is considered RELEVANT if:
        - The content directly discusses, mentions, or relates to the topic in a meaningful way
        - The source provides news coverage, analysis, commentary, or reporting that connects to the topic
        - The publication date is recent enough to be considered current coverage
        - The source appears to be from a legitimate news outlet or publication

        A source should be considered NOT RELEVANT if:
        - It is biased, promotional, or low-quality content
        - It only tangentially mentions the topic without substantial discussion
        - The content is primarily about unrelated subjects
        - The source is clearly outdated for the purposes of current press review
        - The source lacks credibility or appears to be spam/promotional content

        Important context: Today's date is ${new Date().toISOString()}. Use this to assess whether the publication date is recent enough for current press review purposes.

        First, provide your reasoning for why this source should or should not be considered relevant for press review coverage of the topic. Consider the content quality, relevance to the topic, recency, and credibility of the source.

        Then, make your final determination about relevance.

        You should judge sources very rigorously - err on the side of excluding sources that don't clearly and substantially relate to the topic or that lack sufficient quality for professional press review purposes.

        Your response must be in the following JSON format:

        {
          "reasoning": "[Your detailed explanation of why this source is or isn't relevant]",
          "isRelevant": [boolean value expressing whether the source is relevant or not]
        }

        Your output should consist of only the JSON response with no additional text or formatting.
      `;

export const contentExtraction = (topic: string, source: string) => `
        You are a press journalist specializing in the following topic:

        <topic>
        ${topic}
        </topic>

        You will analyze the following source material:

        <source>${JSON.stringify(source)}</source>

        Your goal is to prepare this source for synthesis into a press review report by extracting key facts and opinions from the content and writing a summary.

        Follow these steps:

        1. Carefully read the content to understand its main arguments, facts, and opinions as they relate to the topic.

        2. Write a concise, objective summary of the article. Focus only on information present in the text that is relevant to the topic.

        3. Identify key facts - these are verifiable pieces of information such as statistics, dates, events, names, locations, or other concrete details that can be proven true or false.

        4. Identify opinions - these are subjective statements that reflect the author's or quoted persons' beliefs, views, judgments, predictions, or interpretations. Look for interpretive language, value judgments, or speculative statements.

        Important constraints:
        - Extract only information that is present in the source content
        - Focus only on information relevant to the specified topic
        - Do not add any external information or your own interpretations
        - Maintain objectivity in your summary
        - Distinguish clearly between factual statements and opinion statements

        Structure your response as a single, valid JSON object with no markdown formatting or explanatory text outside the JSON structure. Use this exact format:

        {
          "summary": "comprehensive summary of the source text focusing on topic-relevant content",
          "keyFacts": [
            "first key fact from the source",
            "second key fact from the source"
          ],
          "opinions": [
            "first opinion from the source", 
            "second opinion from the source"
          ]
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
