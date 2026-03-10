import { NodeType } from "../schema/storagenode.schema";

export const DATABASE_CONNECTION = {
  AUTH: 'auth_db',
  INVENTORY: 'inventory_db',
};

export const MASTER_DATA = {
  BRANDS: [
    { name: 'Uniqlo', country: 'Japan', founded: 1949 },
    { name: 'Zara', country: 'Spain', founded: 1975 },
    { name: 'H&M', country: 'Sweden', founded: 1947 },
    { name: 'Nike', country: 'USA', founded: 1964 },
  ],
  CATEGORIES: [
    { name: 'Tops' }, // Áo
    { name: 'Bottoms' }, // Quần
    { name: 'Outerwear' }, // Áo khoác
    { name: 'Footwear' }, // Giày dép
    { name: 'Accessories' }, // Phụ kiện
  ],
  COLORS: [
    { name: 'Black', hexCode: '#000000', rgb: { r: 0, g: 0, b: 0 } },
    { name: 'White', hexCode: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
    { name: 'Navy', hexCode: '#000080', rgb: { r: 0, g: 0, b: 128 } },
    { name: 'Grey', hexCode: '#808080', rgb: { r: 128, g: 128, b: 128 } },
  ],
  SIZES: [
    { name: 'S', measurement: 'Small' },
    { name: 'M', measurement: 'Medium' },
    { name: 'L', measurement: 'Large' },
    { name: 'XL', measurement: 'Extra Large' },
  ],
  NECKLINES: [{ name: 'V-Neck' }, { name: 'Crew Neck' }, { name: 'Polo' }],
  OCCASIONS: [{ name: 'Formal' }, { name: 'Casual' }, { name: 'Sport' }, { name: 'Party' }],
  SEASONS: [{ name: 'Spring' }, { name: 'Summer' }, { name: 'Autumn' }, { name: 'Winter' }],
  STYLES: [
    { name: 'Minimalist', description: 'Clean lines and neutral colors' },
    { name: 'Streetwear', description: 'Comfortable and urban' },
  ],
};

export const LOCATION_MASTER_DATA = [
  {
    name: 'Hà Nội',
    type: NodeType.LOCATION,
    children: [
      {
        name: 'Nguyen Chi Thanh House',
        type: NodeType.HOUSE,
        children: [
          {
            name: 'Phòng ngủ Master',
            type: NodeType.ROOM,
            children: [
              {
                name: 'Tủ gỗ âm tường',
                type: NodeType.CABINET,
                children: [
                  { name: 'Ngăn treo áo sơ mi', type: NodeType.SHELF },
                  { 
                    name: 'Ngăn kéo dưới', 
                    type: NodeType.SHELF,
                    children: [{ name: 'Hộp đựng tất (Box)', type: NodeType.BOX }]
                  },
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Hồ Chí Minh',
    type: NodeType.LOCATION,
    children: [
      {
        name: 'Căn hộ Vinhomes',
        type: NodeType.HOUSE,
        children: [
          {
            name: 'Phòng thay đồ',
            type: NodeType.ROOM,
            children: [
              {
                name: 'Kệ trưng bày túi',
                type: NodeType.CABINET,
                children: [
                  { name: 'Tầng 1', type: NodeType.SHELF },
                  { name: 'Tầng 2', type: NodeType.SHELF }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
