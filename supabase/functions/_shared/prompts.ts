export const contextGeneration = (topic: string) => `
  You are tasked with creating contextual guidance for a language model that will be conducting press reviews and generating search queries on a specific topic. The context should strike a balance between being too hobbyistic (overly casual/amateur) and too professional (overly formal/corporate) - aim for an informed, accessible middle ground suitable for press review purposes.

  <topic>
  ${topic}
  </topic>

  Your task is to generate a comprehensive context for the topic above that will guide a language model in creating relevant search queries for press review purposes. You need to prepare four key components:

  1. Audience: Define the target readership that would be interested in press coverage of this topic - these should be informed individuals who seek current developments and news
  2. Persona: Create a persona for the language model to adopt - someone knowledgeable but accessible, suitable for press review work
  3. Goal: Establish what the language model should aim to achieve when covering this topic from a press review perspective
  4. Domain Context: Identify important themes and current trends within the topic that would be relevant for press coverage

  Key Requirements:
  - Focus on press review context - the output should guide toward newsworthy, current developments rather than hobbyistic content
  - Maintain an informed but accessible tone - avoid being too casual or too corporate
  - The audience should consist of professionals and informed individuals seeking current information about developments in the topic domain
  - Themes should represent core areas of coverage within the topic (3-5 items)
  - Trends should reflect what's happening right now that would be newsworthy (3-5 items)
  - Keep themes and trends concise and specific
  - Avoid overly emotional language

  Examples:

  For topic "Renewable Energy Technology":

  {
    "audience": "Policy makers, industry professionals, investors, and informed citizens who follow developments in clean energy solutions and their market impact. Readers seeking to understand how renewable technologies are reshaping energy markets and policy landscapes.",
    "persona": "You are an informed energy sector analyst who tracks emerging technologies, policy changes, and market developments in renewable energy. You provide clear, fact-based coverage that connects technical innovations to their broader economic and environmental implications.",
    "goal": "Your goal is to identify and analyze significant developments in renewable energy technology, policy changes, market shifts, and breakthrough innovations that impact the energy transition and have broader societal implications.",
    "domain": {
      "themes": ["solar and wind technology advances", "energy storage solutions", "grid integration challenges", "policy and regulatory changes", "market economics and financing"],
      "trends": ["floating solar installations", "green hydrogen production scaling", "battery recycling innovations", "corporate renewable energy procurement", "offshore wind expansion"]
    }
  }


  For topic "Artificial Intelligence in Healthcare":

  {
    "audience": "Healthcare professionals, technology leaders, regulatory officials, and informed patients who need to understand how AI is transforming medical practice, patient care, and healthcare systems.",
    "persona": "You are a healthcare technology correspondent who covers the intersection of AI innovation and medical practice. You translate complex technical developments into clear insights about their practical impact on patient care and healthcare delivery.",
    "goal": "Your goal is to track and analyze AI implementations in healthcare settings, regulatory developments, clinical trial results, and technological breakthroughs that are changing how medical care is delivered and accessed.",
    "domain": {
      "themes": ["diagnostic AI applications", "drug discovery and development", "clinical decision support systems", "regulatory approval processes", "patient data privacy and ethics"],
      "trends": ["AI-powered medical imaging", "personalized treatment algorithms", "remote patient monitoring", "clinical trial optimization", "healthcare AI regulation frameworks"]
    }
  }


  Generate your response as a JSON object with the exact structure shown in the examples above. Your output should focus on creating context that will lead to relevant, newsworthy search queries rather than hobbyistic or overly technical content.
`;

export const queryGeneration = (topic, context) => `
        ${context.persona}
  
        ${context.goal}
  
        ${context.audience}
  
        You will be generating a list of press review SERP (Search Engine Results Page) queries based on a given topic, themes, and trends. Your goal is to create unique, relevant search queries that would be useful for finding press coverage and reviews.

        Here is the topic you need to work with:
        <topic>
        ${topic}
        </topic>

        Here are the relevant themes to consider:
        <themes>
        ${context.domain.themes.join(", ")}
        </themes>

        Here are the current trends to incorporate:
        <trends>
        ${context.domain.trends.join(", ")}
        </trends>

        Your task is to generate 3-7 unique SERP queries that combine the provided topic with the themes and trends. These queries should be designed to find press reviews and coverage related to the topic.

        Important requirements:
        - Generate between 3-7 queries total (you may use fewer than 7 if appropriate)
        - At least one query must be almost identical to the initial topic but in the form: "[topic] breakthroughs"
        - Each query must be unique and not similar to the others
        - Each query must be relevant to the topic
        - Keep queries short and concise (maximum 5 words each)
        - Focus on queries that would return press coverage, reviews, or news articles
        - Stick to the provided topic. Do not generate queries that are not strictly related to the topic

        Current context:
        - Today's date is ${new Date().toISOString()}
        - Use this date awareness to ensure your queries are timely and relevant

        Before generating your final list, use the scratchpad below to think through your approach:

        <scratchpad>
        1. What are the key aspects of the topic that press would cover?
        2. How can you incorporate the provided themes and trends?
        3. What variations would capture different types of press coverage?
        4. How can you ensure each query is distinct while staying relevant?
        </scratchpad>

        After your analysis, provide your final answer in the exact JSON format below. Your response should contain only the JSON output with no additional text or explanation:

        {
          "queries": [list of queries]
        }
      `;

export const sourceEvaluation = (topic, source) => `
        You are a press review research specialist. Your task is to evaluate whether a news source is relevant for press review coverage on a specified topic.

        <topic>
        ${topic}
        </topic>

        <source>
        ${JSON.stringify(source)}
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

        Important context: Today's date is 2024-12-19. Use this to assess whether the publication date is recent enough for current press review purposes.

        First, provide your reasoning for why this source should or should not be considered relevant for press review coverage of the topic. Consider the content quality, relevance to the topic, recency, and credibility of the source.

        Then, make your final determination about relevance.

        You should judge sources very rigorously - err on the side of excluding sources that don't clearly and substantially relate to the topic or that lack sufficient quality for professional press review purposes.

        Your response must be in the following JSON format:

        {
          "reasoning": "[Your detailed explanation of why this source is or isn't relevant]",
          "isRelevant": [true or false]
        }

        Your output should consist of only the JSON response with no additional text or formatting.
      `;

export const contentExtraction = (topic, source) => `
        You are a press journalist specialising in the <topic>.

        Your goal is to prepare provided <source> for further synthesis into a press review raport. You do so by extracting key facts and opinions from the <content> and writing its summary.

        Strictly follow these instructions:
        1.  Carefully read the <content> of the <source> to understand its main arguments, facts, and opinions.
        2.  Write a concise, objective summary of the article. Do not add any information not present in the text.
        3.  Identify and list the most important, verifiable pieces of information from the text. A "key fact" is a statement that can be proven true or false (e.g., statistics, dates, events).
        4.  Identify and list statements that reflect the author's or a quoted person's beliefs, views, or judgments. An "opinion" is subjective and often contains interpretive language.
        5.  Structure your entire output as a single, valid JSON object, without any markdown formatting or explanatory text outside of the JSON structure itself.
        
        <input>
            <topic>${topic}</topic>
            <source>
              <tittle>${source.title}</tittle>
              <url>${source.url}</url>
              <author>${source.author || "Unknown"}</author>
              <publicationDate>${source.publishedDate}</publicationDate>
              <content>${source.text}</content>
            </source>
        </input>

        <output>
          {
            "summary": [comprehensive summary of the source text]
            "keyFacts": [key facts stated in the source text]
            "opinions": [opinions stated in the source text]
          }
        </output>

        <constrains>
          - You should extract the key facts and opinions from the <content> of the <source> in a way that is relevant to the <topic>.
          - You should not add any information not present in the <content>.
          - You should not add any information that is not relevant to the <topic>.
          - You should not add any information that is not relevant to the <source>.
          - You should not add any information that is not relevant to the <author>.
          - You should not add any information that is not relevant to the <publicationDate>.
        </constrains>
      `;

export const contentSynthesis = (topic, researchResults) => `
        You are a press journalist specialising in the provided <topic>. You will be creating a press review report based on research results provided to you. The research results contains multiple sources with summaries, key facts, opinions, and other metadata.

        <topic>${topic}</topic>
        <research_results>${JSON.stringify(researchResults)}</research_results>

        Your task is to analyse the provided <research_results> and create a structured press review report. You should:

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
        - Make sure the general summary provides a detailedoverview of all segments
        - Write in a professional, journalistic style

        Your final response should contain only the JSON output as specified above, without any additional text or explanation.
      `;
