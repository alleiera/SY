import { create } from 'zustand';

// Store structure:
// ribbons: {
//   [windowId]: {
//      activeTab: 'Home',
//      tabs: [
//         { 
//           id: 'Home', 
//           label: 'Giriş', 
//           groups: [
//              {
//                 id: 'file',
//                 label: 'Dosya',
//                 items: [
//                    { id: 'save', label: 'Kaydet', icon: 'Save', onClick: () => {} },
//                 ]
//              }
//           ]
//         }
//      ]
//   }
// }

export const useRibbonStore = create((set) => ({
    ribbons: {},
    setRibbon: (windowId, ribbonConfig) => set((state) => ({
        ribbons: {
            ...state.ribbons,
            [windowId]: {
                ...state.ribbons[windowId],
                ...ribbonConfig,
                // If there's no active tab set, default to the first one
                activeTab: state.ribbons[windowId]?.activeTab || ribbonConfig.tabs?.[0]?.id || 'Home'
            }
        }
    })),
    setActiveTab: (windowId, tabId) => set((state) => ({
        ribbons: {
            ...state.ribbons,
            [windowId]: {
                ...state.ribbons[windowId],
                activeTab: tabId
            }
        }
    })),
    removeRibbon: (windowId) => set((state) => {
        const newRibbons = { ...state.ribbons };
        delete newRibbons[windowId];
        return { ribbons: newRibbons };
    })
}));
