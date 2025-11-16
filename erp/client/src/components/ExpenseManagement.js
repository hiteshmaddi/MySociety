import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  HStack,
  VStack,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Text,
  Badge
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { expensesAPI } from '../services/api';
import { format } from 'date-fns';

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteExpense, setDeleteExpense] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    expense_desc: '',
    amount: '',
    date: '',
    villa_no: '',
    notes: ''
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const from = searchFrom || undefined;
      const to = searchTo || undefined;
      const data = await expensesAPI.getAll(from, to);
      setExpenses(data);
    } catch (error) {
      toast({
        title: 'Error loading expenses',
        description: error.response?.data?.error || 'Failed to load expenses',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExpenses();
  };

  const handleAdd = () => {
    setEditingExpense(null);
    setFormData({
      expense_desc: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      villa_no: '',
      notes: ''
    });
    onOpen();
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_desc: expense.expense_desc || '',
      amount: expense.amount || '',
      date: expense.date || format(new Date(), 'yyyy-MM-dd'),
      villa_no: expense.villa_no || '',
      notes: expense.notes || ''
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, formData);
        toast({
          title: 'Expense updated',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      } else {
        await expensesAPI.create(formData);
        toast({
          title: 'Expense added',
          status: 'success',
          duration: 2000,
          isClosable: true
        });
      }
      onClose();
      loadExpenses();
    } catch (error) {
      toast({
        title: 'Error saving expense',
        description: error.response?.data?.error || 'Failed to save expense',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handleDeleteClick = (expense) => {
    setDeleteExpense(expense);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      await expensesAPI.delete(deleteExpense.id);
      toast({
        title: 'Expense deleted',
        status: 'success',
        duration: 2000,
        isClosable: true
      });
      onDeleteClose();
      loadExpenses();
    } catch (error) {
      toast({
        title: 'Error deleting expense',
        description: error.response?.data?.error || 'Failed to delete expense',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            type="date"
            placeholder="From Date"
            value={searchFrom}
            onChange={(e) => setSearchFrom(e.target.value)}
            maxW="200px"
          />
          <Input
            type="date"
            placeholder="To Date"
            value={searchTo}
            onChange={(e) => setSearchTo(e.target.value)}
            maxW="200px"
          />
          <Button onClick={handleSearch} colorScheme="blue">
            Search
          </Button>
          <Button onClick={handleAdd} colorScheme="green" ml="auto">
            Add Expense
          </Button>
        </HStack>

        <Box overflowX="auto">
          <Table variant="simple" bg="white">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th>Villa No</Th>
                <Th>Created By</Th>
                <Th>Created At</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expenses.map((expense) => (
                <Tr key={expense.id}>
                  <Td>
                    <Text fontSize="xs" color="gray.500">
                      {expense.id.substring(0, 8)}...
                    </Text>
                  </Td>
                  <Td>{expense.expense_desc}</Td>
                  <Td>
                    <Badge colorScheme="green" fontSize="md">
                      ₹{parseFloat(expense.amount).toLocaleString('en-IN')}
                    </Badge>
                  </Td>
                  <Td>{expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : ''}</Td>
                  <Td>{expense.villa_no || '-'}</Td>
                  <Td>{expense.created_by}</Td>
                  <Td>
                    {expense.created_at
                      ? format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm')
                      : ''}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        onClick={() => handleEdit(expense)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteClick(expense)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {expenses.length === 0 && !loading && (
            <Box textAlign="center" py={8} color="gray.500">
              No expenses found
            </Box>
          )}
        </Box>
      </VStack>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingExpense ? 'Edit Expense' : 'Add Expense'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Expense Description</FormLabel>
                <Input
                  value={formData.expense_desc}
                  onChange={(e) => setFormData({ ...formData, expense_desc: e.target.value })}
                  placeholder="Enter expense description"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Amount</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Villa No</FormLabel>
                <Input
                  value={formData.villa_no}
                  onChange={(e) => setFormData({ ...formData, villa_no: e.target.value })}
                  placeholder="Enter villa number (optional)"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter notes (optional)"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Expense
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ExpenseManagement;

