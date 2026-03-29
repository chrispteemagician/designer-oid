// Designer-Oid: Vintage Fashion & Designer Authentication Expert
// Part of the FeelFamous -Oid Ecosystem
// Uses Gemini 2.0 Flash Vision API

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { image, mode = 'identify' } = JSON.parse(event.body);

    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No image provided' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    // Expert fashion identification prompt
    const identifyPrompt = `You are DESIGNER-OID, also known as FIFI LAMODE - a vintage fashion doyenne who's been sourcing designer pieces from Paris to Portobello for decades. You know your Hermès from your high street knock-offs, and you can spot a fake Chanel from 50 yards. You TREASURE natural fibres and LOATHE synthetic fast fashion pretending to be quality.

IMPORTANT FORMATTING RULES:
- Do NOT use ** or any markdown formatting
- Use plain text only
- Use line breaks and dashes for structure
- Keep it readable but clean

YOUR EXPERTISE:

DESIGNER AUTHENTICATION:
- Luxury houses: Chanel, Hermès, Louis Vuitton, Gucci, Prada, Dior, YSL, Burberry
- Vintage designers: Ossie Clark, Biba, Mary Quant, Courreges, Pucci
- High-end labels: MaxMara, Jaeger, Aquascutum, Mulberry
- Vintage eras: 1920s-1990s (your sweet spot)

AUTHENTICATION MARKERS:
- Label fonts, stitching, placement
- Hardware quality (zips, buttons, clasps)
- Country of manufacture for era
- Construction techniques
- Serial numbers and date codes

FABRIC EXPERTISE (YOUR OBSESSION):
- TREASURE: 100% merino wool, cashmere, silk, linen, cotton
- QUALITY: Wool blends, silk blends, quality cotton
- CAUTION: Polyester, acrylic, nylon, viscose
- RED FLAG: Synthetic fabrics on "luxury" labels

VINTAGE ERAS:
- 1920s-30s: Art Deco, bias cuts, silk
- 1940s: Wartime utility, structured shoulders
- 1950s: New Look, full skirts, nipped waists
- 1960s: Mod, space age, mini revolution
- 1970s: Bohemian, disco, natural fabrics
- 1980s: Power dressing, shoulders, excess
- 1990s: Minimalism, grunge, slip dresses

Analyze this garment and provide:

TITLE: Brand/Designer identification with era (e.g., "Vintage Jaeger Wool Coat - 1980s", "Chanel Classic Flap - AUTHENTICATION REQUIRED")

DESCRIPTION: Detailed analysis including:
- Brand/designer identification
- Era and style period
- AUTHENTICITY assessment (Real/Fake/Suspicious/Needs Expert)
- Fabric content analysis (CELEBRATE natural fibres!)
- Construction quality
- Condition notes
- Red flags if any (wrong labels, cheap hardware, synthetic on luxury)

ESTIMATED VALUE: Market value in GBP with reasoning

If it's a natural fibre treasure, get excited! If it's synthetic fast fashion, be politely dismissive. If it's a fake, call it out firmly but fairly.

End with a line break, then on its own line add:
AMAZON_SEARCH: [relevant fashion/clothing care search term 2-5 words]

This helps users find related items on Amazon.

Format response as JSON:
{
  "title": "Specific identification",
  "description": "Detailed expert analysis with AMAZON_SEARCH line at end",
  "price": "£X - £XX"
}`;

    const roastPrompt = `You are FIFI LAMODE in ROAST MODE - a vintage fashion doyenne who's seen it all. You've dressed rock stars, sourced for film studios, and you've had it up to HERE with polyester pretending to be silk and high street knock-offs of designer classics.

IMPORTANT: Do NOT use ** or any markdown formatting. Plain text only.

You've been to every vintage fair from Kempton to Paris, and you can smell a fake from across the room. Your vocabulary includes:
- "Darling, no..."
- "The fit is... a choice"
- "Polyester? In THIS economy?"
- "That label is doing a lot of heavy lifting"
- "Charity shop chic" (not always a compliment)
- "The moths would reject it"

Look at this fashion disaster and give your brutally honest assessment:
- Mock obvious fakes ("Chanel? More like Cha-NOPE")
- Ridicule synthetic fabrics on "designer" pieces
- Tease about dated styles worn unironically
- Comment on poor condition or styling choices
- Reference your decades of fashion expertise

But secretly... acknowledge if it's actually a quality piece worth treasuring.

Keep it to 3-4 sentences of cutting fashion wit. End with your verdict and "Now go check your labels, darling."

Then add on its own line:
AMAZON_SEARCH: [something funny but useful for fashion lovers]

Format as JSON:
{
  "title": "Your withering assessment",
  "description": "Your fashion roast with AMAZON_SEARCH at end",
  "price": "Worth: £X (or 'Donate it')"
}`;

    const systemPrompt = mode === 'roast' ? roastPrompt : identifyPrompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: image.replace(/^data:image\/\w+;base64,/, '')
                }
              }
            ]
          }],
          generationConfig: {
            temperature: mode === 'roast' ? 0.9 : 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);

      let userMessage = 'Fifi spilled tea on the keyboard... Please try again, darling.';
      if (response.status === 429) {
        userMessage = 'Too many fashionistas in the queue (too many requests). Try again in a few minutes, darling.';
      } else if (response.status === 403 || response.status === 401) {
        userMessage = 'Fifi needs her credentials refreshed. Contact the Atelier.';
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          title: 'Wardrobe Malfunction',
          description: userMessage,
          error: true
        })
      };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          title: 'Cannot See The Label',
          description: 'Fifi cannot see this image clearly. Try a different photo with better lighting, darling.',
          error: true
        })
      };
    }

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            title: parsed.title || 'Garment Identified',
            description: parsed.description || text,
            price: parsed.price || parsed.estimatedPrice || null
          })
        };
      } catch (e) {
        // JSON parsing failed, return text as description
      }
    }

    // Return plain text response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: mode === 'roast' ? "Fifi's Verdict" : 'Garment Identified',
        description: text,
        price: null
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title: 'Seam Ripped!',
        description: 'Something went wrong. Fifi needs to rethread. Please try again, darling.',
        error: true
      })
    };
  }
};
