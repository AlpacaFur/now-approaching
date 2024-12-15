import "./credits.css"
import { Author, DATA } from "../../data"

function generateCredits(): DocumentFragment {
  const fragment = document.createDocumentFragment()
  DATA.forEach((entry) => {
    const container = document.createElement("div")
    container.classList.add("credit")
    container.id = entry.slug
    const p = document.createElement("p")

    const link = document.createElement("a")
    link.textContent = entry.longName ?? entry.name
    link.href = entry.url

    const times = entry.times
      .map((time) => {
        return `${time.hour}:${time.min}`
      })
      .join(", ")

    const timeSpan = document.createElement("span")
    timeSpan.textContent = ` (${times})`
    p.append(link)
    p.append(timeSpan)
    p.append(` - ${entry.description ?? ""}`)

    const authorP = document.createElement("p")
    authorP.textContent = "by "
    const authors = (entry.authors ?? [])
      .map((author: Author) => {
        const a = document.createElement("a")
        a.textContent = author.name
        a.href = author.url
        return [a, ", "]
      })
      .flat()
      .slice(0, -1)
    authorP.append(...authors)
    // authorP.append()

    container.append(p)
    container.append(authorP)
    fragment.append(container)
  })
  return fragment
}

document.getElementById("site-credits")!.append(generateCredits())
document
  .getElementById("output")!
  .append(document.getElementById("site-credits")!.innerHTML)
