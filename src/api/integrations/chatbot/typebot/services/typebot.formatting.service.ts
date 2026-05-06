export class TypebotFormattingService {
  /**
   * Apply rich text formatting for TypeBot messages
   */
  public applyFormatting(element: any): string {
    let text = '';

    if (element.text) {
      text += element.text;
    }

    if (element.children && element.type !== 'a') {
      for (const child of element.children) {
        text += this.applyFormatting(child);
      }
    }

    if (element.type === 'p' && element.type !== 'inline-variable') {
      text = text.trim() + '\n';
    }

    if (element.type === 'inline-variable') {
      text = text.trim();
    }

    if (element.type === 'ol') {
      text =
        '\n' +
        text
          .split('\n')
          .map((line, index) => (line ? `${index + 1}. ${line}` : ''))
          .join('\n');
    }

    if (element.type === 'li') {
      text = text
        .split('\n')
        .map((line) => (line ? `  ${line}` : ''))
        .join('\n');
    }

    let formats = '';

    if (element.bold) {
      formats += '*';
    }

    if (element.italic) {
      formats += '_';
    }

    if (element.underline) {
      formats += '~';
    }

    let formattedText = `${formats}${text}${formats.split('').reverse().join('')}`;

    if (element.url) {
      formattedText = element.children[0]?.text ? `[${formattedText}]\n(${element.url})` : `${element.url}`;
    }

    return formattedText;
  }
}
