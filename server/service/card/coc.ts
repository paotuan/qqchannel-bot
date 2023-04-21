import type { ICocCardData } from '../../../interface/card/coc'
import { CocCard } from '../../../interface/card/coc'

export class ServerCocCard extends CocCard {
  constructor(data: ICocCardData) {
    super(data)
  }
}
