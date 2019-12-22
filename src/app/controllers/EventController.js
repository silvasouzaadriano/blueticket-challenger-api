import { Op } from 'sequelize';
import { isBefore, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import Event from '../models/Event';
import File from '../models/File';
import User from '../models/User';

class EventController {
  async index(req, res) {
    let where;
    if (req.query.where === 'just-my-events') {
      where = { owner_id: req.userId };
    } else {
      const { date } = req.query;
      const parsedDate = parseISO(date);
      const startMonth = startOfMonth(parsedDate);
      const endMonth = endOfMonth(parsedDate);
      where = {
        date: {
          [Op.between]: [startMonth, endMonth],
        },
        canceled_at: null,
      };
    }
    const events = await Event.findAll({
      where,
      order: [['date', 'ASC']],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
        },
      ],
    });

    const EventList = events.map(m => ({
      ...m.toJSON(),
    }));

    return res.status(200).json(EventList);
  }

  async show(req, res) {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    if (!event) return res.status(400).json({ error: 'Evento não existe' });

    const {
      title,
      description,
      location,
      date,
      owner,
      past,
      cancelable,
      canceled_at,
      banner,
    } = event;

    return res.status(200).json({
      id,
      title,
      description,
      location,
      date,
      owner,
      past,
      cancelable,
      canceled_at,
      banner,
    });
  }

  async store(req, res) {
    const { title, description, location, date, banner_id } = req.body;

    /* VERIFYING THE BANNER */
    if (banner_id) {
      const image = await File.findByPk(banner_id);
      if (!image)
        return res.status(400).json({ error: 'Banner não encontrado' });
      if (image.type !== 'banner')
        return res.status(400).json({ error: 'Sua foto deve ser um banner' });
    }
    /* VERIFYING PAST DATE */
    if (isBefore(parseISO(date), new Date()))
      return res.status(400).json({
        error: 'Você não pode criar um evento para uma data que já passou!',
      });

    /* CREATING THE EVENT */
    const event = await Event.create({
      title,
      description,
      location,
      date,
      owner_id: req.userId,
      banner_id,
    });

    return res.status(201).json(event);
  }

  async update(req, res) {
    const event = await Event.findOne({ where: { id: req.params.id } });
    const { date, banner_id } = req.body;

    try {
      if (!event) throw new Error('Evento não existe');
      if (event.past) throw new Error('Evento já finalizado');
      if (req.userId !== event.owner_id)
        throw new Error(`Você não é o dono desse evento`);

      /* VERIFYING THE BANNER */
      if (banner_id && banner_id !== Event.banner_id) {
        const image = await File.findByPk(banner_id);
        if (!image) throw new Error('Imagem não encontrada');
        if (image.type !== 'banner')
          throw new Error('Sua foto deve ser um banner');
      }

      /* VERIFYING THE PAST DATE */
      if (date && isBefore(parseISO(date), new Date()))
        throw new Error('Datas antigas não são permitidas');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    await event.update(req.body);

    const { id, title, description, location, banner } = await Event.findByPk(
      req.params.id,
      {
        include: [
          {
            model: File,
            as: 'banner',
            attributes: ['id', 'path', 'url'],
          },
        ],
      }
    );

    return res.status(200).json({
      id,
      title,
      description,
      location,
      date,
      banner,
    });
  }

  async delete(req, res) {
    const event = await Event.findOne({ where: { id: req.params.id } });

    try {
      if (!event) throw new Error('Esse evento não existe!');
      if (event.canceled_at) throw new Error('Esse evento já foi cancelado!');
      if (event.past)
        throw new Error(
          'Você não pode apagar um evento que já foi finalizado!'
        );
      if (req.userId !== event.owner_id)
        throw new Error('Você não é o dono desse evento!');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    event.canceled_at = new Date();

    await event.save();

    return res.status(200).send();
  }
}

export default new EventController();
