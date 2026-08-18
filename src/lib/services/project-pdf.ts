import 'server-only'

import { APP_IDENTITY } from '@/lib/app-identity'
import {
  dateLabel,
  projectStatusLabel,
  requirementStatusLabel,
} from '@/lib/format'
import type { getProject } from '@/lib/services/projects'
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib'

type ProjectPdfData = Awaited<ReturnType<typeof getProject>>
type Font = Awaited<ReturnType<PDFDocument['embedFont']>>

const typeLabels: Record<string, string> = {
  FUNCTIONAL: 'Funcional',
  NON_FUNCTIONAL: 'Não funcional',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const columns = [
  { label: 'Código', width: 60 },
  { label: 'Requisito', width: 185 },
  { label: 'Tipo', width: 85 },
  { label: 'Prioridade', width: 70 },
  { label: 'Status', width: 105 },
  { label: 'Responsável', width: 150 },
  { label: 'Prazo', width: 80 },
] as const

export async function generateProjectPdf(project: ProjectPdfData) {
  const document = await PDFDocument.create()
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const [portraitWidth, portraitHeight] = PageSizes.A4
  const size: [number, number] = [portraitHeight, portraitWidth]
  const margin = 40
  const contentWidth = size[0] - margin * 2
  let page = document.addPage(size)
  let y = size[1] - margin

  page.drawText(pdfText(APP_IDENTITY.name), {
    x: margin,
    y,
    size: 11,
    font: bold,
    color: rgb(0.03, 0.55, 0.68),
  })
  page.drawText('Relatório do projeto', {
    x: size[0] - margin - 105,
    y,
    size: 9,
    font: regular,
    color: rgb(0.4, 0.43, 0.47),
  })
  y -= 30
  page.drawText(pdfText(project.name), {
    x: margin,
    y,
    size: 22,
    font: bold,
    color: rgb(0.08, 0.1, 0.13),
  })
  y -= 19
  const wrappedDescription = wrapText(
    pdfText(project.description),
    regular,
    9,
    contentWidth
  )
  const description = wrappedDescription.slice(0, 8)
  if (wrappedDescription.length > description.length)
    description[description.length - 1] = truncate(
      `${description.at(-1) ?? ''}...`,
      regular,
      9,
      contentWidth
    )
  for (const line of description) {
    page.drawText(line, {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: rgb(0.3, 0.33, 0.37),
    })
    y -= 12
  }
  y -= 10

  const summary = [
    ['Cliente', project.client ?? 'Não informado'],
    ['Equipe', project.team.name],
    ['Gestor atual', project.team.leader?.name ?? 'Não definido'],
    ['Status', projectStatusLabel(project.status)],
    ['Progresso', `${project.progress}%`],
    ['Início', dateLabel(project.start_date)],
    ['Conclusão prevista', dateLabel(project.expected_completion_date)],
  ]
  const summaryWidth = contentWidth / summary.length
  for (const [index, [label, value]] of summary.entries()) {
    const x = margin + index * summaryWidth
    page.drawRectangle({
      x,
      y: y - 42,
      width: summaryWidth - 4,
      height: 48,
      color: rgb(0.96, 0.97, 0.98),
    })
    page.drawText(pdfText(label.toUpperCase()), {
      x: x + 7,
      y: y - 8,
      size: 6.5,
      font: bold,
      color: rgb(0.4, 0.43, 0.47),
    })
    page.drawText(truncate(pdfText(value), regular, 8.5, summaryWidth - 16), {
      x: x + 7,
      y: y - 27,
      size: 8.5,
      font: bold,
      color: rgb(0.12, 0.14, 0.17),
    })
  }
  y -= 72

  page.drawText('Stack tecnológica', {
    x: margin,
    y,
    size: 9,
    font: bold,
    color: rgb(0.3, 0.33, 0.37),
  })
  y -= 14
  const stackLines = wrapText(
    pdfText(
      project.tech_stack.length
        ? project.tech_stack.join(', ')
        : 'Nenhuma tecnologia informada.'
    ),
    regular,
    9,
    contentWidth
  )
  for (const line of stackLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: rgb(0.12, 0.14, 0.17),
    })
    y -= 12
  }
  y -= 18

  page.drawText(`Requisitos (${project.requirements.length})`, {
    x: margin,
    y,
    size: 13,
    font: bold,
    color: rgb(0.08, 0.1, 0.13),
  })
  y -= 22
  drawTableHeader(page, y, margin, bold)
  y -= 22

  if (!project.requirements.length) {
    page.drawText('Nenhum requisito cadastrado neste projeto.', {
      x: margin + 8,
      y: y - 5,
      size: 9,
      font: regular,
      color: rgb(0.4, 0.43, 0.47),
    })
  } else {
    for (const requirement of project.requirements) {
      const cells = [
        requirement.code,
        requirement.title,
        typeLabels[requirement.type] ?? requirement.type,
        priorityLabels[requirement.priority] ?? requirement.priority,
        requirementStatusLabel(requirement.status),
        requirement.users_requirements_assigned_user_idTousers?.name ??
          'Disponível',
        dateLabel(requirement.deadline),
      ]
      const lines = cells.map((cell, index) =>
        wrapText(pdfText(cell), regular, 7.5, columns[index].width - 10)
      )
      const rowHeight = Math.max(
        22,
        Math.max(...lines.map((value) => value.length)) * 10 + 8
      )
      if (y - rowHeight < margin + 22) {
        page = document.addPage(size)
        y = size[1] - margin
        page.drawText(`${pdfText(project.name)} - requisitos`, {
          x: margin,
          y,
          size: 11,
          font: bold,
          color: rgb(0.08, 0.1, 0.13),
        })
        y -= 24
        drawTableHeader(page, y, margin, bold)
        y -= 22
      }
      page.drawRectangle({
        x: margin,
        y: y - rowHeight + 4,
        width: contentWidth,
        height: rowHeight,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.88, 0.89, 0.91),
        borderWidth: 0.5,
      })
      let x = margin
      for (const [index, cellLines] of lines.entries()) {
        for (const [lineIndex, line] of cellLines.entries())
          page.drawText(line, {
            x: x + 5,
            y: y - 9 - lineIndex * 10,
            size: 7.5,
            font: index === 0 ? bold : regular,
            color: rgb(0.15, 0.17, 0.2),
          })
        x += columns[index].width
      }
      y -= rowHeight
    }
  }

  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())
  const pages = document.getPages()
  for (const [index, currentPage] of pages.entries()) {
    currentPage.drawText(pdfText(`Gerado em ${generatedAt}`), {
      x: margin,
      y: 18,
      size: 7,
      font: regular,
      color: rgb(0.45, 0.47, 0.5),
    })
    currentPage.drawText(`Página ${index + 1} de ${pages.length}`, {
      x: size[0] - margin - 68,
      y: 18,
      size: 7,
      font: regular,
      color: rgb(0.45, 0.47, 0.5),
    })
  }
  return document.save()
}

function drawTableHeader(
  page: ReturnType<PDFDocument['addPage']>,
  y: number,
  x: number,
  font: Font
) {
  page.drawRectangle({
    x,
    y: y - 17,
    width: columns.reduce((total, column) => total + column.width, 0),
    height: 22,
    color: rgb(0.12, 0.15, 0.19),
  })
  for (const column of columns) {
    page.drawText(pdfText(column.label), {
      x: x + 5,
      y: y - 9,
      size: 7,
      font,
      color: rgb(1, 1, 1),
    })
    x += column.width
  }
}

function wrapText(text: string, font: Font, size: number, width: number) {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(candidate, size) <= width) line = candidate
      else {
        if (line) lines.push(line)
        line = truncate(word, font, size, width)
      }
    }
    if (line) lines.push(line)
  }
  return lines.length ? lines : ['']
}

function truncate(text: string, font: Font, size: number, width: number) {
  if (font.widthOfTextAtSize(text, size) <= width) return text
  let value = text
  while (value.length && font.widthOfTextAtSize(`${value}...`, size) > width)
    value = value.slice(0, -1)
  return `${value}...`
}

function pdfText(value: string) {
  return value
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\u00A0-\u00FF\u20AC]/g, '?')
}

export function projectPdfFilename(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return `${slug || 'projeto'}.pdf`
}
