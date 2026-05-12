"""Patches the 7 new display fields on existing seeded products (matched by ISBN)."""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from core.database import AsyncSessionLocal
from models.product import Product

PATCHES = {
    "9780451524935": dict(  # Nineteen Eighty-Four
        original_price=14.99, rating=4.8, reviews_count=89234, is_new_arrival=False,
        badge="#1 Bestseller", tags=["Dystopia", "Politics", "Classic"],
        long_description="Winston Smith works for the Ministry of Truth in Oceania, a totalitarian state where Big Brother watches every move. Winston secretly hates the Party and begins a forbidden love affair while fueling his growing hatred of the regime. A chilling vision of a future where independent thought is a crime.",
    ),
    "9780618574940": dict(  # The Fellowship of the Ring
        original_price=19.99, rating=4.9, reviews_count=67845, is_new_arrival=False,
        badge="Staff Pick", tags=["Epic Fantasy", "Adventure", "Classic"],
        long_description="One Ring to rule them all. In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron forged the One Ring to rule them all. Now the Ring has found its way to young Frodo Baggins, and the fate of the world rests on his unlikely shoulders.",
    ),
    "9780062693662": dict(  # Murder on the Orient Express
        original_price=None, rating=4.7, reviews_count=45123, is_new_arrival=False,
        badge="#3 Bestseller", tags=["Mystery", "Whodunit", "Classic"],
        long_description="Just after midnight, a snowdrift stops the Orient Express in its tracks. The next morning, a passenger is found dead in his compartment, stabbed twelve times, his door locked from the inside. Isolated and trapped, Hercule Poirot must identify the killer before they strike again.",
    ),
    "9780307743657": dict(  # The Shining
        original_price=None, rating=4.7, reviews_count=52341, is_new_arrival=False,
        badge="#4 Bestseller", tags=["Horror", "Psychological", "Supernatural"],
        long_description="Jack Torrance's new job at the Overlook Hotel is the perfect chance for a fresh start. As the off-season caretaker, he'll have time for his family and his writing. But as winter closes in, the hotel's dark history begins to possess both the building and its new caretaker.",
    ),
    "9781400033416": dict(  # Beloved
        original_price=19.99, rating=4.5, reviews_count=28901, is_new_arrival=False,
        badge="Staff Pick", tags=["Historical Fiction", "American Literature", "Pulitzer Prize"],
        long_description="Sethe was born a slave and escaped to Ohio, but eighteen years later she is still not free. Her new life is haunted by the ghost of her baby, who died nameless and whose tombstone is engraved with a single word: Beloved. Toni Morrison's Pulitzer Prize-winning masterwork.",
    ),
    "9780375704024": dict(  # Norwegian Wood
        original_price=None, rating=4.3, reviews_count=18765, is_new_arrival=False,
        badge=None, tags=["Coming of Age", "Japanese Literature", "Romance"],
        long_description="When Toru Watanabe hears the Beatles' 'Norwegian Wood', he is overwhelmed by grief. He is transported back to his college days in 1960s Tokyo — a time of intense friendship and love, and the strangely affecting friendship he shares with a beautiful but emotionally troubled young woman.",
    ),
    "9780060883287": dict(  # One Hundred Years of Solitude
        original_price=21.99, rating=4.8, reviews_count=41234, is_new_arrival=False,
        badge="#5 Bestseller", tags=["Magical Realism", "Latin American Literature", "Nobel Prize"],
        long_description="The story of the rise and fall of the mythical town of Macondo through the history of the Buendía family. Weaving the miraculous and the mundane, García Márquez created a seminal work of magical realism and one of the most important novels of the 20th century.",
    ),
    "9780385490818": dict(  # The Handmaid's Tale
        original_price=18.99, rating=4.6, reviews_count=62345, is_new_arrival=False,
        badge="#6 Bestseller", tags=["Dystopia", "Feminism", "Political Fiction"],
        long_description="Offred is a Handmaid in the Republic of Gilead. She may leave the Commander's house once a day to walk to food markets whose signs are pictures instead of words, because women are no longer allowed to read. A harrowing portrait of a near-future theocracy.",
    ),
    "9780307455925": dict(  # Americanah
        original_price=None, rating=4.4, reviews_count=14567, is_new_arrival=False,
        badge=None, tags=["Race", "Identity", "Immigration"],
        long_description="Ifemelu and Obinze are young and in love when they depart military-ruled Nigeria for the West. Beautiful, self-assured Ifemelu heads for America, where despite academic success, she grapples with what it means to be black for the first time — and finds a voice in her popular blog.",
    ),
    "9780307387899": dict(  # The Road
        original_price=None, rating=4.3, reviews_count=35678, is_new_arrival=False,
        badge=None, tags=["Post-Apocalyptic", "Survival", "Pulitzer Prize"],
        long_description="A father and his young son walk alone through burned America, heading slowly toward the coast. Nothing moves in the ravaged landscape. They have nothing but a pistol, their clothes, a cart of scavenged food. A Pulitzer Prize-winning meditation on love, survival, and the will to live.",
    ),
    "9780441478125": dict(  # The Left Hand of Darkness
        original_price=15.99, rating=4.4, reviews_count=9876, is_new_arrival=False,
        badge="Staff Pick", tags=["Science Fiction", "Gender", "Classic"],
        long_description="A lone human ambassador travels to the icy planet of Gethen to convince its inhabitants to join the growing interstellar civilization. But to speak for humanity, he must understand a world where the inhabitants have no fixed sex — and where the very nature of personhood is questioned.",
    ),
    "9780380973651": dict(  # American Gods
        original_price=20.99, rating=4.5, reviews_count=48901, is_new_arrival=False,
        badge="#7 Bestseller", tags=["Mythology", "Fantasy", "American Literature"],
        long_description="Shadow is a man with a past. Released from prison to find his wife has died, he meets the enigmatic Mr Wednesday, who claims to be a refugee from a distant war, a former god and the king of America. A road trip across a mythological America where old gods battle new ones.",
    ),
    "9780525432494": dict(  # The Secret History
        original_price=21.99, rating=4.5, reviews_count=32456, is_new_arrival=False,
        badge="#8 Bestseller", tags=["Literary Fiction", "Dark Academia", "Thriller"],
        long_description="Under the influence of a charismatic classics professor, a group of eccentric misfits at a New England college discover a way of living apart from ordinary morality. But when they slip gradually from obsession to corruption, and then to murder, the consequences are devastating.",
    ),
    "9780679731726": dict(  # The Remains of the Day
        original_price=None, rating=4.4, reviews_count=21345, is_new_arrival=False,
        badge=None, tags=["Booker Prize", "Duty", "Memory"],
        long_description="In 1956, an English butler named Stevens takes a motoring trip through the West Country to visit a former housekeeper. During his journey, his narration reveals the cost of his own dignity — the life sacrificed in service to a flawed master, and the love never acknowledged.",
    ),
    "9781609450786": dict(  # My Brilliant Friend
        original_price=None, rating=4.4, reviews_count=29876, is_new_arrival=False,
        badge="#9 Bestseller", tags=["Italian Literature", "Friendship", "Coming of Age"],
        long_description="A rich, intense story about two friends, Elena and Lila, growing up in a poor neighborhood of Naples in the 1950s. Ferrante's inimitable style lends itself to a meticulous portrait of a city seething with violence and ambition, and of a friendship that shapes two remarkable women.",
    ),
    "9780385542364": dict(  # The Underground Railroad
        original_price=20.99, rating=4.5, reviews_count=16789, is_new_arrival=True,
        badge="Staff Pick", tags=["Historical Fiction", "Pulitzer Prize", "American History"],
        long_description="Cora is a slave on a cotton plantation in Georgia. When Caesar tells her about the Underground Railroad, they decide to take a terrifying risk and flee. Whitehead reimagines the Railroad as a literal train network beneath the earth, carrying freedom seekers through a nightmarish America.",
    ),
    "9781455563937": dict(  # Pachinko
        original_price=21.99, rating=4.6, reviews_count=35678, is_new_arrival=True,
        badge="#10 Bestseller", tags=["Family Saga", "Korean Literature", "Historical Fiction"],
        long_description="Beginning in early 20th-century Korea, Pachinko follows a family across four generations as they navigate war, identity, love, and the pain of being Korean in Japan. A sweeping saga of sacrifice, ambition, and belonging from one of America's most celebrated novelists.",
    ),
    "9780571334650": dict(  # Normal People
        original_price=None, rating=4.2, reviews_count=41234, is_new_arrival=True,
        badge="#11 Bestseller", tags=["Contemporary Fiction", "Romance", "Coming of Age"],
        long_description="Connell and Marianne grow up in the same small Irish town, but their social worlds couldn't be more different. At school he is popular; she is a loner. Years later at Trinity College Dublin, their paths cross again and they begin a relationship that will define their lives.",
    ),
    "9780316556347": dict(  # Circe
        original_price=20.99, rating=4.6, reviews_count=58234, is_new_arrival=False,
        badge="Staff Pick", tags=["Mythology", "Fantasy", "Feminist Retelling"],
        long_description="In the house of Helios, god of the sun, a daughter is born with neither the look of her father nor the power of her mother. Scorned and rejected, Circe turns to witchcraft. When her gift threatens the gods, she is exiled to a deserted island — where she will meet the great heroes and villains of her age.",
    ),
    "9780735224292": dict(  # Where the Crawdads Sing
        original_price=21.99, rating=4.7, reviews_count=89345, is_new_arrival=True,
        badge="#18 Bestseller", tags=["Mystery", "Nature", "Coming of Age"],
        long_description="For years, rumors of the 'Marsh Girl' have haunted Barkley Cove, North Carolina. So when handsome Chase Andrews is found dead, locals immediately suspect Kya Clark. But Kya is not what they say. A story of nature and nurture, loneliness and belonging, truth and lies.",
    ),
    "9780062316097": dict(  # Sapiens
        original_price=22.99, rating=4.6, reviews_count=112345, is_new_arrival=False,
        badge="#12 Bestseller", tags=["History", "Anthropology", "Popular Science"],
        long_description="100,000 years ago, at least six human species inhabited Earth. Today there is only one. What happened to the others? And what may happen to us? Harari traces the whole of human history, from the first humans to walk the earth to the radical revolutions of the present day.",
    ),
    "9781400052189": dict(  # The Immortal Life of Henrietta Lacks
        original_price=None, rating=4.5, reviews_count=23456, is_new_arrival=False,
        badge=None, tags=["Medical Science", "Ethics", "Biography"],
        long_description="Her name was Henrietta Lacks, but scientists know her as HeLa. She was a poor Black tobacco farmer whose cells — taken without her knowledge in 1951 — became one of the most important tools in medicine, vital for developing the polio vaccine, cloning, and gene mapping.",
    ),
    "9780374533557": dict(  # Thinking, Fast and Slow
        original_price=None, rating=4.5, reviews_count=67890, is_new_arrival=False,
        badge="#13 Bestseller", tags=["Psychology", "Behavioral Economics", "Decision Making"],
        long_description="Nobel Prize-winning psychologist Daniel Kahneman takes us on a tour of the mind and explains the two systems that drive the way we think. System 1 is fast, intuitive, and emotional; System 2 is slower, deliberative, and logical. Understanding both changes how you make decisions forever.",
    ),
    "9780399590504": dict(  # Educated
        original_price=21.99, rating=4.7, reviews_count=78901, is_new_arrival=False,
        badge="#14 Bestseller", tags=["Memoir", "Family", "Resilience"],
        long_description="Tara Westover was seventeen the first time she set foot in a classroom. Born to survivalists in the mountains of Idaho, she prepared for the end of the world by stockpiling food. Educated is an account of the struggle for self-invention against a family that tried to erase her.",
    ),
    "9781524763138": dict(  # Becoming
        original_price=24.99, rating=4.8, reviews_count=134567, is_new_arrival=False,
        badge="#15 Bestseller", tags=["Memoir", "Inspiration", "American History"],
        long_description="In a life filled with meaning and accomplishment, Michelle Obama has emerged as one of the most iconic women of our era. As First Lady of the United States, she helped create the most welcoming White House in history, while establishing herself as a powerful advocate for women and girls worldwide.",
    ),
    "9780812968255": dict(  # Meditations
        original_price=None, rating=4.7, reviews_count=34567, is_new_arrival=False,
        badge=None, tags=["Stoicism", "Philosophy", "Ancient Wisdom"],
        long_description="Written as a source for his own guidance, Marcus Aurelius never intended these private reflections to be published. Yet their intimacy and directness have made them one of the great books of Western civilization — a timeless guide on how to live with virtue, resilience, and peace.",
    ),
    "9780807014295": dict(  # Man's Search for Meaning
        original_price=14.99, rating=4.8, reviews_count=89012, is_new_arrival=False,
        badge="#16 Bestseller", tags=["Holocaust", "Philosophy", "Psychology"],
        long_description="Psychiatrist Viktor Frankl's memoir has riveted generations with its descriptions of life in Nazi death camps and its lessons for spiritual survival. He argues that we cannot avoid suffering but we can choose how to cope with it, find meaning in it, and move forward with renewed purpose.",
    ),
    "9781401245252": dict(  # Watchmen
        original_price=29.99, rating=4.7, reviews_count=45678, is_new_arrival=False,
        badge=None, tags=["Graphic Novel", "Superheroes", "Political Thriller"],
        long_description="This Hugo Award-winning graphic novel chronicles the fall from grace of a group of super-heroes plagued by all-too-human failings. Set in an alternate America where costumed adventurers are real, it deconstructs the superhero myth and casts a dark shadow over the whole genre.",
    ),
    "9780399226908": dict(  # The Very Hungry Caterpillar
        original_price=None, rating=4.9, reviews_count=215678, is_new_arrival=False,
        badge=None, tags=["Children's Classic", "Picture Book", "Educational"],
        long_description="On Sunday morning the warm sun came up and — pop! — out of the egg came a tiny and very hungry caterpillar. He started to look for some food. The beloved classic by Eric Carle, with its iconic die-cut pages, has delighted children and parents for over 50 years.",
    ),
    "9780385539258": dict(  # A Little Life
        original_price=22.99, rating=4.5, reviews_count=28901, is_new_arrival=True,
        badge="New", tags=["Literary Fiction", "Friendship", "Trauma"],
        long_description="When four classmates from a small Massachusetts college move to New York, they're broke, adrift, and buoyed only by their friendship and ambitions. Anchored by the brilliant but damaged Jude St. Francis, A Little Life is a devastating portrait of the lasting effects of childhood trauma.",
    ),
}


async def patch() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Product).where(Product.isbn.in_(list(PATCHES.keys()))))
        products = result.scalars().all()
        updated = 0
        for product in products:
            patch_data = PATCHES.get(product.isbn)
            if not patch_data:
                continue
            for field, value in patch_data.items():
                setattr(product, field, value)
            updated += 1
        await db.commit()
        print(f"Patched {updated} products with display fields.")
        if updated < len(PATCHES):
            print(f"Warning: {len(PATCHES) - updated} ISBNs not found in DB.")


if __name__ == "__main__":
    asyncio.run(patch())
