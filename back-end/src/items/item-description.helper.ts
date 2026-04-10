export class ItemDescriptionHelper {
  static build(item: any): string {
    const parts = [
      `Item: ${item.name}`,
      `Category: ${item.category}`,
      `Brand: ${item.brand}`,
      `Style: ${item.style}`,
      `Occasion: ${item.occasion}`,
      `Season: ${item.seasonCode}`,
      `Neckline: ${item.neckline}`,
      `Sleeve Length: ${item.sleeveLength}`,
      `Color: ${item.color}`,
      `Tags: ${item.tags?.join(', ')}`,
      // `Material: ${item.material || 'unknown'}`,
    ];
    return parts.join('. ');
  }
}
