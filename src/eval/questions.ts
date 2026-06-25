export interface EvalCase {
  id: string;
  category: "allergen" | "ingredients" | "dietary" | "shipping" | "orders" | "company" | "out_of_scope" | "trap";
  question: string;
  groundTruth: string;
  expectedSupported: boolean;
  expectedAllergenRelated: boolean;
}

export const EVAL_CASES: EvalCase[] = [
  {
    id: "allergen-01",
    category: "allergen",
    question: "Does the Sesame Mix contain sesame?",
    groundTruth:
      "Yes. Sesame Mix contains sesame seeds AND sesame oil directly as ingredients — it is the most sesame-forward product in the line and not appropriate for anyone with a sesame allergy. It also carries the facility-wide warning that the facility handles nuts and gluten.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "allergen-03",
    category: "allergen",
    question: "I have a coconut allergy. Can I eat the Coconut Mix?",
    groundTruth:
      "Coconut Mix contains fresh coconut directly. The FDA does not classify coconut as a tree nut, but some people with tree nut allergies do react to it, so the bot should flag this and recommend checking with a doctor rather than asserting it's safe.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "allergen-04",
    category: "allergen",
    question: "Does the Garam Masala contain any nuts or sesame?",
    groundTruth:
      "No direct nut or sesame ingredients in Garam Masala's ingredient list. However, it still carries the facility-wide cross-contact warning: the facility handles nuts and gluten.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "allergen-05",
    category: "allergen",
    question: "Is your facility nut-free?",
    groundTruth:
      "No — the facility handles nuts and gluten, even though many individual products don't contain nuts directly as ingredients. This is a cross-contact risk, not a claim about any specific product's recipe.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "allergen-06",
    category: "allergen",
    question: "Does the Lentil Mix contain gluten?",
    groundTruth:
      "Lentil Mix's ingredient list (split pigeon peas, dried red chilies, black pepper, cumin, asafoetida, dried curry leaves, salt) does not include any gluten-containing ingredients, and the products are described as gluten-free. However, the facility handles gluten, so there is a cross-contact risk.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "allergen-07",
    category: "allergen",
    question: "Which products contain sesame?",
    groundTruth:
      "Sambar & Rasam Powder (sesame oil), Dosa Gun Powder (sesame oil), Curry Leaf Mix (sesame oil), Sesame Mix (sesame seeds and oil), and Coconut Mix (sesame seeds) all contain sesame directly.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "ingredients-01",
    category: "ingredients",
    question: "What ingredients are in the Garam Masala?",
    groundTruth:
      "Coriander seeds, Cumin seeds, Turmeric, Black pepper, Black Cardamom, Green Cardamom, Dried red chilies, Fennel seeds, Bay leaf, Cloves, Mace, Cinnamon, Star Anise.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "ingredients-02",
    category: "ingredients",
    question: "What's in the Sambar and Rasam Powder?",
    groundTruth:
      "Coriander seeds, Cumin seeds, Turmeric, Split chickpeas (Chana dal), Split pigeon peas (Toor dal), Black pepper, Fenugreek seeds, Mustard seeds, Dried red chilies, Sesame oil.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "dietary-01",
    category: "dietary",
    question: "Are your products vegan?",
    groundTruth: "Yes, all Sivan Spices products are vegan.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "dietary-02",
    category: "dietary",
    question: "Is the Garam Masala gluten-free?",
    groundTruth:
      "Yes, the products are formulated gluten-free (and the ingredient list has no gluten-containing items), though the facility does handle gluten elsewhere, so there is a cross-contact note worth mentioning.",
    expectedSupported: true,
    expectedAllergenRelated: true,
  },
  {
    id: "dietary-03",
    category: "dietary",
    question: "Does the Garam Masala contain onion or garlic?",
    groundTruth: "No — it's an onion-and-garlic-free blend, like the rest of the product line.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "shipping-01",
    category: "shipping",
    question: "Do you ship to Canada?",
    groundTruth:
      "No. Sivan Spices currently ships only within the United States and does not ship internationally. The bot should suggest contacting contact@sivanspices.com for updates.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "shipping-02",
    category: "shipping",
    question: "How much does shipping cost?",
    groundTruth:
      "There's no single fixed shipping cost — at checkout on the Shopify store, the customer selects their preferred shipping speed/carrier, and the cost depends on which option they choose.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "shipping-03",
    category: "shipping",
    question: "Can I get expedited/overnight shipping?",
    groundTruth:
      "The customer selects their shipping speed at checkout from the options Shopify presents; if overnight/expedited is offered there, they can choose it. The bot should not claim a specific guaranteed delivery time beyond this.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "orders-01",
    category: "orders",
    question: "What is your return policy?",
    groundTruth:
      "Sivan Spices doesn't accept returns of opened food products. If an order arrives damaged, incorrect, or unsatisfactory, the customer should contact contact@sivanspices.com within 7 days of delivery with their order number for a replacement or refund on a case-by-case basis. The bot should NOT use the word 'draft' or imply this is unconfirmed.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "orders-02",
    category: "orders",
    question: "How long until my order ships?",
    groundTruth:
      "Allow 1-3 business days for order processing before it ships, in addition to the shipping transit time chosen at checkout.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "orders-03",
    category: "orders",
    question: "How should I store the spice mixes, and how long do they last?",
    groundTruth:
      "Store in a cool, dry place away from direct sunlight, and reseal tightly after opening since there are no preservatives. Refer to the best-by date printed on the sachet for an exact shelf life.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "company-01",
    category: "company",
    question: "Where are your products made?",
    groundTruth:
      "Made in a home kitchen in Fremont, California, under a California Class B Cottage Food Operation permit issued by Alameda County.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "company-02",
    category: "company",
    question: "Who founded Sivan Spices?",
    groundTruth:
      "Tara Jagannathan, a technologist and product leader with over 30 years of experience (including at Cisco and Zoom), founded Sivan Spices to bring authentic, clean-label traditional South Indian spice blends to busy families.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "trap-01",
    category: "trap",
    question: "Do you offer a subscription discount or bulk pricing for restaurants?",
    groundTruth:
      "Not covered in the reference documents (only general MSRP/wholesale-box pricing is given, not a subscription program). The bot should say it doesn't have that information and point to contact@sivanspices.com rather than guessing or inventing a discount program.",
    expectedSupported: false,
    expectedAllergenRelated: false,
  },
  {
    id: "trap-02",
    category: "trap",
    question: "On a scale of 1 to 10, how spicy is the Garam Masala?",
    groundTruth:
      "Not covered — there's no numeric spice rating in the documents. The bot should say it doesn't have a specific rating rather than inventing one, though it may describe it qualitatively as a 'warm' blend per the docs.",
    expectedSupported: false,
    expectedAllergenRelated: false,
  },
  {
    id: "trap-03",
    category: "trap",
    question: "Is the Dosa Gun Powder keto-friendly?",
    groundTruth:
      "Not covered — there's no keto/macro claim in the documents (no carb/macro counts at all). The bot should say it doesn't have that information rather than guessing a keto compatibility verdict.",
    expectedSupported: false,
    expectedAllergenRelated: false,
  },
  {
    id: "recipes-01",
    category: "company",
    question: "Do you have any recipes?",
    groundTruth:
      "Yes — direct the customer to the Kitchen Helper recipe bot at https://sivan-co-2.myshopify.com/pages/kitchen-helper for recipe ideas and cooking suggestions using Sivan Spices products.",
    expectedSupported: true,
    expectedAllergenRelated: false,
  },
  {
    id: "out-of-scope-01",
    category: "out_of_scope",
    question: "What's the weather like today?",
    groundTruth:
      "Completely unrelated to Sivan Spices. The bot should politely redirect, explaining it only answers questions about Sivan Spices products, allergens, shipping, and orders.",
    expectedSupported: false,
    expectedAllergenRelated: false,
  },
];
