"""MSME archetypes and the eight named demo personas.

Each archetype defines a prior over the latent financial-health factor theta
(higher = healthier) and stylistic parameters that shape the synthetic series.
"""

from dataclasses import dataclass, field


@dataclass
class Archetype:
    key: str
    label: str
    sector: str
    theta_mean: float          # latent health prior
    theta_sd: float
    base_turnover: float       # monthly GST turnover, INR
    seasonality: float         # amplitude 0..1
    upi_share: float           # share of revenue via UPI
    b2b_share: float           # share of revenue from B2B
    cyclicality: float         # sector cyclicality 0..1
    tier_probs: tuple = (0.15, 0.30, 0.35, 0.20)  # P(T0..T3-ish) -> we use T1..T3 + thin


ARCHETYPES: dict[str, Archetype] = {
    "kirana": Archetype("kirana", "Kirana / General Store", "Retail Trade",
                        0.15, 0.9, 450_000, 0.15, 0.85, 0.05, 0.2),
    "textile_exporter": Archetype("textile_exporter", "Textile Exporter", "Textiles",
                                  0.30, 0.8, 6_500_000, 0.45, 0.10, 0.90, 0.6),
    "auto_components": Archetype("auto_components", "Auto Components Mfg", "Manufacturing",
                                 0.25, 0.9, 4_200_000, 0.20, 0.05, 0.95, 0.7),
    "cloud_kitchen": Archetype("cloud_kitchen", "Cloud Kitchen", "Food Services",
                               0.00, 1.0, 900_000, 0.25, 0.95, 0.05, 0.5),
    "pharma_dist": Archetype("pharma_dist", "Pharma Distributor", "Pharma Trade",
                             0.55, 0.6, 3_800_000, 0.08, 0.20, 0.80, 0.2),
    "agri_tools": Archetype("agri_tools", "Agri Equipment", "Agri Inputs",
                            0.10, 0.9, 1_600_000, 0.55, 0.35, 0.55, 0.8),
    "boutique": Archetype("boutique", "Fashion Boutique", "Apparel Retail",
                          0.05, 0.9, 350_000, 0.35, 0.75, 0.05, 0.4),
    "construction": Archetype("construction", "Construction Contractor", "Construction",
                              -0.10, 1.0, 5_500_000, 0.30, 0.05, 0.90, 0.9),
}


@dataclass
class DemoPersona:
    """A named MSME used in the demo UI, with a hand-set latent profile."""
    id: str
    name: str
    city: str
    state: str
    archetype: str
    vintage_years: int
    theta: float               # pinned latent health (drives everything)
    tier: str                  # data availability: T1 / T2 / T3
    story: str
    proprietor: str
    seed: int
    overrides: dict = field(default_factory=dict)


DEMO_PERSONAS: list[DemoPersona] = [
    DemoPersona(
        id="MSME-2401", name="Chandra Kirana Stores", city="Indore", state="MP",
        archetype="kirana", vintage_years=6, theta=0.85, tier="T1",
        story="New-to-credit neighbourhood store. No audited financials, no bureau file — "
              "but a vivid daily UPI pulse and six years of steady trade.",
        proprietor="Ramesh Chandra", seed=101,
        overrides={"filing_delay_bias": 0.8},
    ),
    DemoPersona(
        id="MSME-2402", name="Meenakshi Textiles", city="Surat", state="GJ",
        archetype="textile_exporter", vintage_years=11, theta=0.85, tier="T3",
        story="Established exporter with strong compliance — but over half of revenue "
              "rides on a single overseas buyer.",
        proprietor="Meenakshi Patel", seed=102,
        overrides={"top_payer_share": 0.56},
    ),
    DemoPersona(
        id="MSME-2403", name="Rathod Auto Components", city="Pune", state="MH",
        archetype="auto_components", vintage_years=14, theta=-0.95, tier="T3",
        story="Tier-2 OEM supplier sliding for five months: shrinking orders, stretching "
              "receivables, two EMI bounces. The early-warning case.",
        proprietor="Vikram Rathod", seed=103,
        overrides={"declining": True, "bounce_count": 2},
    ),
    DemoPersona(
        id="MSME-2404", name="Blue Tiffin Kitchens", city="Bengaluru", state="KA",
        archetype="cloud_kitchen", vintage_years=2, theta=0.35, tier="T2",
        story="Hyper-growth cloud kitchen: order volumes doubling yearly, cash-flow "
              "volatile, aggregator-dependent.",
        proprietor="Ananya Rao", seed=104,
        overrides={"growth_boost": 0.35, "top_payer_share": 0.62},
    ),
    DemoPersona(
        id="MSME-2405", name="Shree Balaji Pharma Distributors", city="Nagpur", state="MH",
        archetype="pharma_dist", vintage_years=18, theta=1.35, tier="T3",
        story="Two decades of metronome-steady distribution. Flawless GST record, "
              "diversified chemist network. The benchmark book.",
        proprietor="Suresh Balaji", seed=105,
    ),
    DemoPersona(
        id="MSME-2406", name="Kaveri Agri Tools", city="Coimbatore", state="TN",
        archetype="agri_tools", vintage_years=9, theta=0.10, tier="T2",
        story="Solid monsoon-cycle business: strong seasons, thin off-seasons. "
              "Needs a working-capital line shaped to the crop calendar.",
        proprietor="K. Murugan", seed=106,
    ),
    DemoPersona(
        id="MSME-2407", name="Noor Fashion House", city="Lucknow", state="UP",
        archetype="boutique", vintage_years=4, theta=0.05, tier="T1",
        story="Young boutique formalising fast — filings improving quarter on quarter, "
              "Instagram-driven UPI sales climbing.",
        proprietor="Noor Fatima", seed=107,
        overrides={"improving_compliance": True},
    ),
    DemoPersona(
        id="MSME-2408", name="Ganpati Constructions", city="Ahmedabad", state="GJ",
        archetype="construction", vintage_years=12, theta=-0.35, tier="T2",
        story="Capable contractor trapped in lumpy government receivables — long dry "
              "spells, then a flood. Referral case: viable with covenants.",
        proprietor="Jignesh Trivedi", seed=108,
        overrides={"lumpy": True},
    ),
]
