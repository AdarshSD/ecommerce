"""Seeds 15 genres, 20 authors, and 30 books with associations."""

import asyncio
import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date
from sqlalchemy import select
from core.database import AsyncSessionLocal
from models.category import Category
from models.linked_entity import LinkedEntity
from models.product import Product, ProductCategoryLink, ProductEntityLink

GENRES = [
    "Fiction", "Non-Fiction", "Mystery & Thriller", "Science Fiction", "Fantasy",
    "Biography & Memoir", "History", "Self-Help", "Romance", "Horror",
    "Children's", "Graphic Novel", "Philosophy", "Travel", "Science & Nature",
]

AUTHORS = [
    ("George Orwell", "English novelist and essayist, known for dystopian fiction."),
    ("J.R.R. Tolkien", "English author and philologist, creator of Middle-earth."),
    ("Agatha Christie", "British crime writer, the best-selling fiction writer of all time."),
    ("Stephen King", "American author of horror, supernatural fiction, and suspense."),
    ("Toni Morrison", "American novelist and Nobel Prize laureate."),
    ("Haruki Murakami", "Japanese author known for surrealism and pop culture."),
    ("Gabriel García Márquez", "Colombian novelist and father of magical realism."),
    ("Margaret Atwood", "Canadian author, poet, and literary critic."),
    ("Chimamanda Ngozi Adichie", "Nigerian author known for feminist literature."),
    ("Cormac McCarthy", "American novelist known for dark themes and sparse prose."),
    ("Ursula K. Le Guin", "American author of science fiction and fantasy."),
    ("Neil Gaiman", "English author of novels, short stories, and graphic novels."),
    ("Donna Tartt", "American author known for literary fiction."),
    ("Kazuo Ishiguro", "British novelist and Nobel Prize laureate."),
    ("Elena Ferrante", "Italian author known for the Neapolitan Novels."),
    ("Colson Whitehead", "American author and two-time Pulitzer Prize winner."),
    ("Min Jin Lee", "Korean-American author known for multigenerational sagas."),
    ("Sally Rooney", "Irish author known for contemporary literary fiction."),
    ("Madeline Miller", "American author known for mythological retellings."),
    ("Delia Owens", "American author and wildlife scientist."),
    ("Yuval Noah Harari", "Israeli historian and author."),
    ("Rebecca Skloot", "American science writer."),
    ("Daniel Kahneman", "Israeli-American psychologist and economist."),
    ("Tara Westover", "American author and historian."),
    ("Michelle Obama", "American attorney and author, former First Lady."),
    ("Marcus Aurelius", "Roman emperor and Stoic philosopher."),
    ("Viktor E. Frankl", "Austrian psychiatrist and Holocaust survivor."),
    ("Alan Moore", "English writer known for subversive graphic novels."),
    ("Eric Carle", "American designer and author of children's books."),
    ("Hanya Yanagihara", "American author known for emotionally intense fiction."),
]

BOOKS = [
    dict(title="Nineteen Eighty-Four", isbn="9780451524935", price=9.99, format="paperback", page_count=328, publisher="Secker & Warburg", published_at=date(1949, 6, 8), stock_count=45, is_featured=True, is_bestseller=True, bestseller_rank=1, authors=["George Orwell"], genres=["Fiction", "Science Fiction"]),
    dict(title="The Fellowship of the Ring", isbn="9780618574940", price=14.99, format="hardcover", page_count=479, publisher="Allen & Unwin", published_at=date(1954, 7, 29), stock_count=38, is_featured=True, is_bestseller=True, bestseller_rank=2, authors=["J.R.R. Tolkien"], genres=["Fantasy", "Fiction"]),
    dict(title="Murder on the Orient Express", isbn="9780062693662", price=12.99, format="paperback", page_count=256, publisher="Collins Crime Club", published_at=date(1934, 1, 1), stock_count=30, is_bestseller=True, bestseller_rank=3, authors=["Agatha Christie"], genres=["Mystery & Thriller"]),
    dict(title="The Shining", isbn="9780307743657", price=13.99, format="paperback", page_count=447, publisher="Doubleday", published_at=date(1977, 1, 28), stock_count=25, is_bestseller=True, bestseller_rank=4, authors=["Stephen King"], genres=["Horror", "Fiction"]),
    dict(title="Beloved", isbn="9781400033416", price=14.99, format="paperback", page_count=275, publisher="Alfred A. Knopf", published_at=date(1987, 9, 16), stock_count=22, is_featured=True, is_bestseller=False, authors=["Toni Morrison"], genres=["Fiction"]),
    dict(title="Norwegian Wood", isbn="9780375704024", price=15.99, format="paperback", page_count=296, publisher="Kodansha", published_at=date(1987, 9, 4), stock_count=20, authors=["Haruki Murakami"], genres=["Fiction", "Romance"]),
    dict(title="One Hundred Years of Solitude", isbn="9780060883287", price=16.99, format="paperback", page_count=422, publisher="Harper & Row", published_at=date(1967, 5, 30), stock_count=28, is_bestseller=True, bestseller_rank=5, authors=["Gabriel García Márquez"], genres=["Fiction"]),
    dict(title="The Handmaid's Tale", isbn="9780385490818", price=13.99, format="paperback", page_count=311, publisher="McClelland and Stewart", published_at=date(1985, 8, 17), stock_count=35, is_bestseller=True, bestseller_rank=6, authors=["Margaret Atwood"], genres=["Fiction", "Science Fiction"]),
    dict(title="Americanah", isbn="9780307455925", price=16.99, format="paperback", page_count=477, publisher="Alfred A. Knopf", published_at=date(2013, 5, 14), stock_count=18, authors=["Chimamanda Ngozi Adichie"], genres=["Fiction"]),
    dict(title="The Road", isbn="9780307387899", price=12.99, format="paperback", page_count=287, publisher="Alfred A. Knopf", published_at=date(2006, 9, 26), stock_count=24, authors=["Cormac McCarthy"], genres=["Fiction", "Science Fiction"]),
    dict(title="The Left Hand of Darkness", isbn="9780441478125", price=11.99, format="paperback", page_count=286, publisher="Ace Books", published_at=date(1969, 3, 1), stock_count=15, is_featured=True, authors=["Ursula K. Le Guin"], genres=["Science Fiction", "Fantasy"]),
    dict(title="American Gods", isbn="9780380973651", price=15.99, format="paperback", page_count=635, publisher="William Morrow", published_at=date(2001, 6, 19), stock_count=28, is_bestseller=True, bestseller_rank=7, authors=["Neil Gaiman"], genres=["Fantasy", "Fiction"]),
    dict(title="The Secret History", isbn="9780525432494", price=16.99, format="hardcover", page_count=544, publisher="Alfred A. Knopf", published_at=date(1992, 9, 16), stock_count=20, is_featured=True, is_bestseller=True, bestseller_rank=8, authors=["Donna Tartt"], genres=["Mystery & Thriller", "Fiction"]),
    dict(title="The Remains of the Day", isbn="9780679731726", price=14.99, format="paperback", page_count=245, publisher="Faber and Faber", published_at=date(1989, 5, 11), stock_count=18, authors=["Kazuo Ishiguro"], genres=["Fiction"]),
    dict(title="My Brilliant Friend", isbn="9781609450786", price=17.99, format="paperback", page_count=336, publisher="Europa Editions", published_at=date(2011, 10, 1), stock_count=25, is_bestseller=True, bestseller_rank=9, authors=["Elena Ferrante"], genres=["Fiction"]),
    dict(title="The Underground Railroad", isbn="9780385542364", price=15.99, format="hardcover", page_count=306, publisher="Doubleday", published_at=date(2016, 8, 2), stock_count=22, is_featured=True, authors=["Colson Whitehead"], genres=["Fiction", "History"]),
    dict(title="Pachinko", isbn="9781455563937", price=16.99, format="paperback", page_count=485, publisher="Grand Central Publishing", published_at=date(2017, 2, 7), stock_count=20, is_bestseller=True, bestseller_rank=10, authors=["Min Jin Lee"], genres=["Fiction"]),
    dict(title="Normal People", isbn="9780571334650", price=14.99, format="paperback", page_count=266, publisher="Faber and Faber", published_at=date(2018, 8, 30), stock_count=30, is_bestseller=True, bestseller_rank=11, authors=["Sally Rooney"], genres=["Fiction", "Romance"]),
    dict(title="Circe", isbn="9780316556347", price=15.99, format="paperback", page_count=393, publisher="Little, Brown", published_at=date(2018, 4, 10), stock_count=28, is_featured=True, is_bestseller=True, bestseller_rank=17, authors=["Madeline Miller"], genres=["Fantasy", "Fiction"]),
    dict(title="Where the Crawdads Sing", isbn="9780735224292", price=16.99, format="paperback", page_count=368, publisher="G.P. Putnam's Sons", published_at=date(2018, 8, 14), stock_count=40, is_bestseller=True, bestseller_rank=18, authors=["Delia Owens"], genres=["Fiction", "Mystery & Thriller"]),
    dict(title="Sapiens: A Brief History of Humankind", isbn="9780062316097", price=17.99, format="paperback", page_count=443, publisher="Harper", published_at=date(2011, 1, 1), stock_count=35, is_bestseller=True, bestseller_rank=12, authors=["Yuval Noah Harari"], genres=["Non-Fiction", "History", "Science & Nature"]),
    dict(title="The Immortal Life of Henrietta Lacks", isbn="9781400052189", price=14.99, format="paperback", page_count=381, publisher="Crown", published_at=date(2010, 2, 2), stock_count=20, authors=["Rebecca Skloot"], genres=["Non-Fiction", "Biography & Memoir", "Science & Nature"]),
    dict(title="Thinking, Fast and Slow", isbn="9780374533557", price=17.99, format="paperback", page_count=499, publisher="Farrar, Straus and Giroux", published_at=date(2011, 10, 25), stock_count=22, is_bestseller=True, bestseller_rank=13, authors=["Daniel Kahneman"], genres=["Non-Fiction", "Self-Help"]),
    dict(title="Educated", isbn="9780399590504", price=16.99, format="hardcover", page_count=352, publisher="Random House", published_at=date(2018, 2, 20), stock_count=30, is_featured=True, is_bestseller=True, bestseller_rank=14, authors=["Tara Westover"], genres=["Biography & Memoir", "Non-Fiction"]),
    dict(title="Becoming", isbn="9781524763138", price=18.99, format="hardcover", page_count=448, publisher="Crown", published_at=date(2018, 11, 13), stock_count=35, is_bestseller=True, bestseller_rank=15, authors=["Michelle Obama"], genres=["Biography & Memoir", "Non-Fiction"]),
    dict(title="Meditations", isbn="9780812968255", price=9.99, format="paperback", page_count=254, publisher="Random House", published_at=date(2003, 1, 1), stock_count=40, authors=["Marcus Aurelius"], genres=["Philosophy", "Non-Fiction"]),
    dict(title="Man's Search for Meaning", isbn="9780807014295", price=10.99, format="paperback", page_count=165, publisher="Beacon Press", published_at=date(1946, 1, 1), stock_count=45, is_featured=True, is_bestseller=True, bestseller_rank=16, authors=["Viktor E. Frankl"], genres=["Biography & Memoir", "Philosophy", "Self-Help"]),
    dict(title="Watchmen", isbn="9781401245252", price=24.99, format="hardcover", page_count=416, publisher="DC Comics", published_at=date(1987, 9, 1), stock_count=15, authors=["Alan Moore"], genres=["Graphic Novel", "Fiction"]),
    dict(title="The Very Hungry Caterpillar", isbn="9780399226908", price=9.99, format="hardcover", page_count=26, publisher="World Publishing", published_at=date(1969, 3, 20), stock_count=60, authors=["Eric Carle"], genres=["Children's"]),
    dict(title="A Little Life", isbn="9780385539258", price=18.99, format="paperback", page_count=814, publisher="Doubleday", published_at=date(2015, 3, 10), stock_count=18, authors=["Hanya Yanagihara"], genres=["Fiction"]),
]


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug.strip("-")


async def seed_products() -> None:
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(Product))).scalars().first()
        if existing:
            print("Products already seeded. Skipping.")
            return

        # Seed categories
        cat_map = {}
        for i, name in enumerate(GENRES):
            cat = Category(name=name, slug=_slugify(name), display_order=i)
            db.add(cat)
            await db.flush()
            cat_map[name] = cat.id
        print(f"Created {len(GENRES)} categories.")

        # Seed authors
        author_map = {}
        for name, bio in AUTHORS:
            entity = LinkedEntity(name=name, bio=bio)
            db.add(entity)
            await db.flush()
            author_map[name] = entity.id
        print(f"Created {len(AUTHORS)} authors.")

        # Seed books
        for book in BOOKS:
            authors = book.pop("authors")
            genres = book.pop("genres")
            book["is_in_stock"] = book.get("stock_count", 0) > 0
            book.setdefault("is_featured", False)
            book.setdefault("is_bestseller", False)
            book.setdefault("bestseller_rank", None)
            book.setdefault("is_recommended", False)
            product = Product(**book)
            db.add(product)
            await db.flush()
            for i, author_name in enumerate(authors):
                if author_name in author_map:
                    db.add(ProductEntityLink(product_id=product.id, entity_id=author_map[author_name], display_order=i))
            for genre_name in genres:
                if genre_name in cat_map:
                    db.add(ProductCategoryLink(product_id=product.id, category_id=cat_map[genre_name]))

        await db.commit()
        print(f"Created {len(BOOKS)} books with categories and authors.")


if __name__ == "__main__":
    asyncio.run(seed_products())
